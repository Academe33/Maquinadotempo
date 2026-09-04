// Pré-gera as vozes fixas do app no ElevenLabs e salva em public/voices/.
// Arquivos já existentes são pulados, então rodar de novo só gera o que falta.
//
//   npm run voices:generate                 → tela inicial + todos os personagens
//   npm run voices:generate -- --home       → só as falas da tela inicial
//   npm run voices:generate -- --limit 10   → tela inicial + 10 primeiros personagens
//   npm run voices:generate -- --id albert-einstein --id pitagoras
//   npm run voices:generate -- --dry-run    → só mostra o que seria gerado e o custo
//
// Cada personagem custa ~300 caracteres de crédito (4 falas da máquina + 1 de
// chegada). Confira o saldo do plano antes de gerar os 96 de uma vez.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { synthesize, cachedPath, getApiKey, getCacheDir } from '../services/ttsServer.js';
import { machineLines, arrivalLine, HOME_LINES, characterVoiceKey } from '../services/voiceLines.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flag = name => args.includes(`--${name}`);
const values = name => args.flatMap((a, i) => (a === `--${name}` ? [args[i + 1]] : []));
const limit = Number(values('limit')[0] ?? Infinity);
const onlyIds = values('id');
const dryRun = flag('dry-run');
const homeOnly = flag('home');

// constants.tsx importa wikiData (1 MB) e usa extensão .tsx; lemos os campos
// direto do texto para não depender do bundler.
function loadCharacters() {
  const src = fs.readFileSync(path.join(__dirname, '..', 'constants.tsx'), 'utf8');
  const chars = [];
  const blockRe = /\{\s*id:\s*'([^']+)'[\s\S]*?\}/g;
  let m;
  while ((m = blockRe.exec(src))) {
    const block = m[0];
    const get = key => block.match(new RegExp(`${key}:\\s*'((?:[^'\\\\]|\\\\.)*)'`))?.[1]?.replace(/\\'/g, "'");
    const name = get('name');
    if (!name) continue;
    chars.push({ id: m[1], name, title: get('title') ?? '', description: get('description') ?? '', voiceName: get('voiceName') });
  }
  return chars;
}

const SECTORS = ['MATEMÁTICA', 'FÍSICA', 'QUÍMICA', 'BIOLOGIA', 'HISTÓRIA', 'GEOGRAFIA', 'FILOSOFIA', 'LITERATURA'];

const jobs = [];
jobs.push({ voice: 'machine', text: HOME_LINES.welcome, label: 'home/welcome' });
for (const s of SECTORS) jobs.push({ voice: 'machine', text: HOME_LINES.sector(s), label: `home/setor ${s}` });

if (!homeOnly) {
  let chars = loadCharacters();
  if (onlyIds.length) chars = chars.filter(c => onlyIds.includes(c.id));
  chars = chars.slice(0, limit);
  for (const c of chars) {
    const lines = machineLines(c);
    for (const [k, text] of Object.entries(lines)) jobs.push({ voice: 'machine', text, label: `${c.id}/${k}` });
    jobs.push({ voice: characterVoiceKey(c), text: arrivalLine(c), label: `${c.id}/chegada` });
  }
}

const pending = jobs.filter(j => !fs.existsSync(cachedPath(j.voice, j.text)));
const chars = pending.reduce((n, j) => n + j.text.length, 0);
console.log(`Cache: ${getCacheDir()}`);
console.log(`${jobs.length} falas no total, ${jobs.length - pending.length} já em cache, ${pending.length} a gerar (~${chars} caracteres).`);

if (dryRun) {
  for (const j of pending) console.log(`  [${j.voice}] ${j.label}: "${j.text}"`);
  process.exit(0);
}
if (!pending.length) process.exit(0);
if (!getApiKey()) {
  console.error('ELEVEN_API_KEY não encontrada (.env / .env.local).');
  process.exit(1);
}

let ok = 0;
for (const j of pending) {
  try {
    await synthesize(j.voice, j.text, { log: { log: () => undefined, warn: console.warn } });
    ok++;
    console.log(`  ✓ ${j.label}`);
  } catch (err) {
    console.error(`  ✗ ${j.label}: ${err.message}`);
    if (/401|quota|limit/i.test(err.message)) break;
  }
}
console.log(`${ok}/${pending.length} geradas.`);
