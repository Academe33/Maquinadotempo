// Voz da Máquina do Tempo (o "computador de bordo").
//
// Primeiro tenta a voz de alta qualidade gerada no ElevenLabs (com cache em
// memória, arquivo estático e servidor). Se a voz não puder ser obtida —
// sem chave, sem rede, créditos esgotados — cai no sintetizador do navegador
// (Web Speech API), que é gratuito e funciona offline.

import { fetchVoice, playBufferElement, Playback } from './tts';
import type { TimeMachineAudio } from './timeMachineSfx';

const hasSpeech = typeof window !== 'undefined' && 'speechSynthesis' in window;

let cachedVoice: SpeechSynthesisVoice | null | undefined;
let current: Playback | null = null;

function pickVoice(): SpeechSynthesisVoice | null {
  if (!hasSpeech) return null;
  if (cachedVoice !== undefined) return cachedVoice;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  const score = (v: SpeechSynthesisVoice) => {
    const lang = v.lang.toLowerCase().replace('_', '-');
    let s = 0;
    if (lang === 'pt-br') s += 10;
    else if (lang.startsWith('pt')) s += 5;
    if (/google|premium|enhanced|natural|neural/i.test(v.name)) s += 2;
    if (/luciana|felipe|francisca|antonio|camila|thalita/i.test(v.name)) s += 1;
    return s;
  };

  const best = [...voices].sort((a, b) => score(b) - score(a))[0];
  cachedVoice = best && score(best) > 0 ? best : null;
  return cachedVoice;
}

/** Pré-aquece a lista de vozes do navegador (fallback). */
export function warmUpVoices() {
  if (!hasSpeech) return;
  pickVoice();
  window.speechSynthesis.addEventListener('voiceschanged', () => {
    cachedVoice = undefined;
    pickVoice();
  }, { once: true });
}

function estimateMs(text: string, rate: number) {
  return Math.max(800, (text.length / 14) * 1000 / rate + 600);
}

function speakWithBrowser(text: string): Promise<void> {
  const rate = 1.06;
  const estimated = estimateMs(text, rate);
  const maxMs = estimated * 1.15 + 800;
  if (!hasSpeech) return new Promise(resolve => setTimeout(resolve, 300));

  return new Promise(resolve => {
    let done = false;
    let started = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      clearTimeout(startTimer);
      resolve();
    };
    const timer = setTimeout(finish, maxMs);
    const startTimer = setTimeout(() => { if (!started) finish(); }, 1500);

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'pt-BR';
    utter.rate = rate;
    utter.pitch = 0.65;
    const voice = pickVoice();
    if (voice) utter.voice = voice;
    utter.onstart = () => { started = true; };
    utter.onend = finish;
    utter.onerror = finish;
    try {
      window.speechSynthesis.resume();
      window.speechSynthesis.speak(utter);
    } catch {
      finish();
    }
  });
}

export interface MachineSpeakOptions {
  /** Toca pelo master da máquina (fade-out e compressor incluídos) */
  audio?: TimeMachineAudio | null;
}

/**
 * Fala como a máquina. Resolve quando a fala termina.
 * ElevenLabs primeiro; Web Speech como plano B.
 */
export async function speakAsMachine(text: string, opts: MachineSpeakOptions = {}): Promise<void> {
  cancelMachineSpeech();
  try {
    const buffer = await fetchVoice('machine', text);
    const playback = opts.audio?.available
      ? await opts.audio.playVoice(buffer)
      : playBufferElement(buffer);
    current = playback;
    await playback.done;
    if (current === playback) current = null;
    return;
  } catch (err) {
    console.warn('Voz ElevenLabs indisponível, usando o sintetizador do navegador:', (err as Error).message);
  }
  await speakWithBrowser(text);
}

export function cancelMachineSpeech() {
  if (current) {
    current.stop();
    current = null;
  }
  if (hasSpeech) {
    try { window.speechSynthesis.cancel(); } catch { /* ignora */ }
  }
}
