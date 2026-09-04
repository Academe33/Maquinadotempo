// Voz da Máquina do Tempo (o "computador de bordo"), usando a Web Speech API
// do navegador. Sem custo, sem rede, e com timbre robótico que combina com a
// cena. Cada fala retorna uma Promise que resolve ao terminar (ou por timeout,
// porque alguns navegadores não disparam `onend` de forma confiável).

const hasSpeech = typeof window !== 'undefined' && 'speechSynthesis' in window;

let cachedVoice: SpeechSynthesisVoice | null | undefined;

function pickVoice(): SpeechSynthesisVoice | null {
  if (!hasSpeech) return null;
  if (cachedVoice !== undefined) return cachedVoice;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null; // ainda carregando; tenta de novo depois

  const score = (v: SpeechSynthesisVoice) => {
    const lang = v.lang.toLowerCase().replace('_', '-');
    let s = 0;
    if (lang === 'pt-br') s += 10;
    else if (lang.startsWith('pt')) s += 5;
    // Vozes "premium" costumam soar melhor
    if (/google|premium|enhanced|natural|neural/i.test(v.name)) s += 2;
    if (/luciana|felipe|francisca|antonio|camila|thalita/i.test(v.name)) s += 1;
    return s;
  };

  const best = [...voices].sort((a, b) => score(b) - score(a))[0];
  cachedVoice = best && score(best) > 0 ? best : null;
  return cachedVoice;
}

/** Pré-aquece a lista de vozes (alguns navegadores carregam de forma assíncrona). */
export function warmUpVoices() {
  if (!hasSpeech) return;
  pickVoice();
  window.speechSynthesis.addEventListener('voiceschanged', () => {
    cachedVoice = undefined;
    pickVoice();
  }, { once: true });
}

export interface SpeakOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  /** Tempo máximo de espera, em ms (proteção contra `onend` que nunca chega) */
  maxMs?: number;
}

function estimateMs(text: string, rate: number) {
  // ~ 14 caracteres por segundo em pt-BR na velocidade 1.0
  return Math.max(800, (text.length / 14) * 1000 / rate + 600);
}

export function speakAsMachine(text: string, opts: SpeakOptions = {}): Promise<void> {
  const rate = opts.rate ?? 1.06;
  const estimated = estimateMs(text, rate);
  const maxMs = opts.maxMs ?? estimated * 1.15 + 800;

  // Sem síntese de voz: resolve rápido, a animação segue o tempo mínimo visual
  if (!hasSpeech) {
    return new Promise(resolve => setTimeout(resolve, 300));
  }

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
    // Se a fala não começar logo (sem vozes instaladas, síntese bloqueada),
    // não segura a animação esperando por ela
    const startTimer = setTimeout(() => { if (!started) finish(); }, 1500);

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'pt-BR';
    utter.rate = rate;
    utter.pitch = opts.pitch ?? 0.65; // mais grave: soa como computador de bordo
    utter.volume = opts.volume ?? 1;
    const voice = pickVoice();
    if (voice) utter.voice = voice;
    utter.onstart = () => { started = true; };
    utter.onend = finish;
    utter.onerror = finish;

    try {
      // Chrome às vezes fica "pausado" depois de um cancel(); garante retomada
      window.speechSynthesis.resume();
      window.speechSynthesis.speak(utter);
    } catch {
      finish();
    }
  });
}

export function cancelMachineSpeech() {
  if (!hasSpeech) return;
  try { window.speechSynthesis.cancel(); } catch { /* ignora */ }
}
