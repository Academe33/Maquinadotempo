// Cliente de voz (ElevenLabs via backend) com três níveis de cache:
// 1. memória (a mesma fala nunca é baixada duas vezes na sessão);
// 2. arquivo estático em /voices/<hash>.mp3 (gerado antes e commitado,
//    ou salvo pelo servidor de desenvolvimento em public/voices);
// 3. POST /api/tts, que gera no ElevenLabs e guarda em disco no servidor.

export type VoiceKey = 'machine' | 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';

const VOICE_VERSION = 'v1'; // precisa bater com services/ttsServer.js

const memory = new Map<string, Promise<ArrayBuffer>>();

async function sha1Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-1', data);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function download(voice: VoiceKey, text: string): Promise<ArrayBuffer> {
  // Nível 2: arquivo estático. Em SPA um 404 pode voltar como index.html,
  // por isso confere o content-type.
  try {
    const hash = await sha1Hex(`${VOICE_VERSION}|${voice}|${text}`);
    const res = await fetch(`/voices/${hash}.mp3`, { cache: 'force-cache' });
    const type = res.headers.get('content-type') || '';
    if (res.ok && /audio|octet-stream/i.test(type)) return await res.arrayBuffer();
  } catch { /* segue para a API */ }

  // Nível 3: gera (ou lê do cache do servidor)
  const res = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ voice, text }),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.error || `Falha ao gerar voz (${res.status})`);
  }
  return res.arrayBuffer();
}

/** Baixa (ou reaproveita) o MP3 de uma fala. Sempre devolve uma cópia. */
export async function fetchVoice(voice: VoiceKey, text: string): Promise<ArrayBuffer> {
  const key = `${voice}|${text}`;
  let pending = memory.get(key);
  if (!pending) {
    pending = download(voice, text);
    pending.catch(() => memory.delete(key));
    memory.set(key, pending);
  }
  const buffer = await pending;
  return buffer.slice(0);
}

/** Pré-aquece o cache sem tocar nada. Erros são ignorados. */
export function prefetchVoices(voice: VoiceKey, texts: string[]) {
  for (const text of texts) fetchVoice(voice, text).catch(() => undefined);
}

export interface Playback {
  done: Promise<void>;
  stop: () => void;
}

/** Toca por um <audio> (sem AudioContext). Requer gesto prévio do usuário. */
export function playBufferElement(buffer: ArrayBuffer, volume = 1): Playback {
  const url = URL.createObjectURL(new Blob([buffer], { type: 'audio/mpeg' }));
  const el = new Audio(url);
  el.volume = volume;
  let finish: () => void = () => undefined;
  const done = new Promise<void>(resolve => { finish = resolve; });
  const end = () => { URL.revokeObjectURL(url); finish(); };
  el.addEventListener('ended', end, { once: true });
  el.addEventListener('error', end, { once: true });
  el.play().catch(end);
  return { done, stop: () => { el.pause(); end(); } };
}

/** Toca dentro de um AudioContext (permite medidor de volume, ganho, etc.). */
export async function playBufferInContext(
  buffer: ArrayBuffer,
  ctx: AudioContext,
  destination: AudioNode = ctx.destination
): Promise<Playback> {
  const audioBuffer = await ctx.decodeAudioData(buffer);
  const source = ctx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(destination);
  let finish: () => void = () => undefined;
  const done = new Promise<void>(resolve => { finish = resolve; });
  source.addEventListener('ended', () => finish(), { once: true });
  source.start();
  return { done, stop: () => { try { source.stop(); } catch { /* já parou */ } finish(); } };
}
