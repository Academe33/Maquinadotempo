// Geração de voz com ElevenLabs + cache em disco (lado do servidor).
//
// Cada fala é identificada por um hash de (versão, voz, texto). Se o arquivo
// já existe no diretório de cache, é servido de lá e nada é gerado de novo.
// Em desenvolvimento o cache fica em `public/voices/`, que o Vite e o Express
// também servem como estático — assim o navegador nem precisa passar pela API
// nas próximas vezes. Na Vercel o disco é efêmero, então o cache vai para /tmp
// (vale enquanto a função estiver quente); para persistir em produção, rode
// `npm run voices:generate` e commite `public/voices/`.

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const VOICE_VERSION = 'v1';
export const ELEVEN_MODEL = 'eleven_multilingual_v2';
export const OUTPUT_FORMAT = 'mp3_44100_96';
export const MAX_TEXT_LENGTH = 400;

// Chaves de voz usadas pelo app. Os nomes são procurados na biblioteca da
// conta (ordem de preferência); o `id` é o fallback caso nenhum exista.
export const VOICE_PRESETS = {
  // Computador de bordo da máquina do tempo
  machine: {
    names: ['Daniel', 'Brian', 'George'],
    id: 'onwK4e9ZLuTAKqWW03F9',
    settings: { stability: 0.62, similarity_boost: 0.8, style: 0.12, use_speaker_boost: true },
  },
  // Mapeamento das vozes Gemini dos personagens → vozes ElevenLabs
  Puck:   { names: ['Borges', 'Chris', 'Will'],        id: 'iP95p4xoKVk53GoZ742B' },
  Charon: { names: ['George', 'Brian', 'Adam Stone'],  id: 'JBFqnCBsd6RMkjVDRZzb' },
  Fenrir: { names: ['Bill', 'Adam', 'Roger'],          id: 'pqHfZKP75CvOlQylNhV4' },
  Kore:   { names: ['Ana Alice', 'Matilda', 'Sarah'],  id: 'XrExE9yKIg1WjnnlVkGX' },
  Zephyr: { names: ['Roberta', 'Jessica', 'Lily'],     id: 'cgSgspJ2msm6clMCkdW9' },
};

const CHARACTER_SETTINGS = { stability: 0.42, similarity_boost: 0.8, style: 0.35, use_speaker_boost: true };

export function getApiKey() {
  return process.env.ELEVEN_API_KEY || process.env.ELEVENLABS_API_KEY;
}

export function getCacheDir() {
  if (process.env.VOICE_CACHE_DIR) return process.env.VOICE_CACHE_DIR;
  if (process.env.VERCEL) return '/tmp/voices';
  return path.join(__dirname, '..', 'public', 'voices');
}

export function voiceHash(voiceKey, text) {
  return crypto.createHash('sha1').update(`${VOICE_VERSION}|${voiceKey}|${text}`).digest('hex');
}

export function cachedPath(voiceKey, text) {
  return path.join(getCacheDir(), `${voiceHash(voiceKey, text)}.mp3`);
}

// ---------- Resolução de vozes ----------

let voiceListCache = { at: 0, byName: new Map() };

async function loadVoiceLibrary(apiKey) {
  if (Date.now() - voiceListCache.at < 10 * 60 * 1000 && voiceListCache.byName.size) return voiceListCache.byName;
  try {
    const res = await fetch('https://api.elevenlabs.io/v1/voices', { headers: { 'xi-api-key': apiKey } });
    if (!res.ok) throw new Error(`voices ${res.status}`);
    const data = await res.json();
    const byName = new Map();
    for (const v of data.voices ?? []) {
      // "George - Warm, Captivating Storyteller" → "george"
      const short = v.name.split(/\s[-–]\s/)[0].trim().toLowerCase();
      if (!byName.has(short)) byName.set(short, v.voice_id);
      byName.set(v.name.toLowerCase(), v.voice_id);
    }
    voiceListCache = { at: Date.now(), byName };
  } catch (err) {
    console.warn('Não foi possível listar vozes do ElevenLabs, usando IDs padrão:', err.message);
  }
  return voiceListCache.byName;
}

export async function resolveVoiceId(voiceKey, apiKey) {
  const preset = VOICE_PRESETS[voiceKey];
  if (!preset) throw new Error(`Voz desconhecida: ${voiceKey}`);
  const override = process.env[`ELEVEN_VOICE_${voiceKey.toUpperCase()}`];
  if (override) return override;
  const library = await loadVoiceLibrary(apiKey);
  for (const name of preset.names) {
    const id = library.get(name.toLowerCase());
    if (id) return id;
  }
  return preset.id;
}

// ---------- Fila de geração ----------
// O plano Starter aceita no máximo 3 requisições simultâneas; o app pede
// várias falas de uma vez (prefetch), então serializamos aqui e tentamos
// de novo com espera quando o ElevenLabs devolve 429.

const MAX_CONCURRENT = Number(process.env.ELEVEN_MAX_CONCURRENT || 2);
let running = 0;
const waiting = [];

function acquire() {
  return new Promise(resolve => {
    const tryStart = () => {
      if (running < MAX_CONCURRENT) { running++; resolve(); }
      else waiting.push(tryStart);
    };
    tryStart();
  });
}
function release() {
  running--;
  const next = waiting.shift();
  if (next) next();
}

// Mesma fala pedida duas vezes ao mesmo tempo → uma única geração
const inFlight = new Map();

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function requestElevenLabs(voiceId, text, settings, apiKey) {
  let attempt = 0;
  for (;;) {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=${OUTPUT_FORMAT}`,
      {
        method: 'POST',
        headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
        body: JSON.stringify({ text, model_id: ELEVEN_MODEL, voice_settings: settings }),
      }
    );
    if (res.ok) return Buffer.from(await res.arrayBuffer());
    const detail = await res.text().catch(() => '');
    if (res.status === 429 && attempt < 4) {
      attempt++;
      await sleep(600 * attempt + Math.random() * 400);
      continue;
    }
    throw new Error(`ElevenLabs ${res.status}: ${detail.slice(0, 300)}`);
  }
}

// ---------- Geração ----------

/**
 * Retorna { buffer, cached } com o MP3 da fala. Gera via ElevenLabs só se
 * não houver arquivo em cache.
 */
export async function synthesize(voiceKey, text, { log = console } = {}) {
  const clean = String(text ?? '').trim();
  if (!clean) throw new Error('Texto vazio');
  if (clean.length > MAX_TEXT_LENGTH) throw new Error(`Texto acima de ${MAX_TEXT_LENGTH} caracteres`);
  if (!VOICE_PRESETS[voiceKey]) throw new Error(`Voz desconhecida: ${voiceKey}`);

  const file = cachedPath(voiceKey, clean);
  if (fs.existsSync(file)) {
    return { buffer: fs.readFileSync(file), cached: true, file };
  }

  const apiKey = getApiKey();
  if (!apiKey) throw new Error('ELEVEN_API_KEY não configurada no servidor');

  if (inFlight.has(file)) return { buffer: await inFlight.get(file), cached: false, file };

  const job = (async () => {
    await acquire();
    try {
      // Pode ter sido gerado por outro pedido enquanto esperava na fila
      if (fs.existsSync(file)) return fs.readFileSync(file);
      const voiceId = await resolveVoiceId(voiceKey, apiKey);
      const settings = VOICE_PRESETS[voiceKey].settings ?? CHARACTER_SETTINGS;
      const buffer = await requestElevenLabs(voiceId, clean, settings, apiKey);
      try {
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, buffer);
      } catch (err) {
        log.warn?.('Não foi possível salvar a voz em cache:', err.message);
      }
      log.log?.(`[tts] gerado (${voiceKey}, ${clean.length} chars): "${clean.slice(0, 50)}"`);
      return buffer;
    } finally {
      release();
      inFlight.delete(file);
    }
  })();
  inFlight.set(file, job);
  return { buffer: await job, cached: false, file };
}
