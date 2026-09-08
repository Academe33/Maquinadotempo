import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Character } from '../types';
import { getGeminiClient, encode, decode, decodeAudioData } from '../services/gemini';
import { LiveServerMessage, Modality } from '@google/genai';
import { Mic, PhoneOff, RefreshCw, ArrowLeft } from 'lucide-react';
import Logo from './Logo';
import AmbientWarp from './TimeMachine/AmbientWarp';
import Portal from './TimeMachine/Portal';
import { parseEra, PRESENT_YEAR } from '../services/era';

interface LiveConversationProps {
  character: Character;
  onClose: () => void;
  /**
   * Modo "viagem no tempo": o personagem acaba de ser trazido pela máquina
   * e começa desorientado ("Ah... onde eu estou? Eu sou ...").
   */
  arrivalMode?: boolean;
  /**
   * Quando false, a sessão conecta mas segura a primeira fala (e o microfone)
   * até virar true. Usado para esperar a animação da máquina terminar.
   */
  greetingReady?: boolean;
}

/** Trecho da legenda amarrado ao trecho de áudio correspondente */
interface CaptionSegment {
  text: string;
  /** Instante (no relógio do AudioContext de saída) em que o trecho começa a ser falado */
  start: number;
  /** Instante em que o trecho termina */
  end: number;
}

// Depois de soltar o botão, o último pedaço do microfone ainda está no
// buffer; continua enviando por este tempo antes de fechar o turno.
const RELEASE_TAIL_MS = 320;
// Toque mais curto que isto quase nunca tem fala: mostra a dica de segurar
const SHORT_PRESS_MS = 350;
// Quanto tempo a legenda fica na tela depois da última palavra
const CAPTION_LINGER_S = 2.4;

const isMobileDevice = () =>
  typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

/**
 * Mantém só o fim do texto: descarta frases inteiras do começo enquanto
 * couber, e no limite corta em palavra. A legenda mostra o que está sendo
 * dito agora, não a fala inteira.
 */
function trimCaption(text: string, max: number): string {
  let out = text.trimStart();
  const sentence = /[.!?…]+["”)]?\s+/g;
  while (out.length > max) {
    sentence.lastIndex = 0;
    const m = sentence.exec(out);
    if (m && m.index + m[0].length < out.length) {
      out = out.slice(m.index + m[0].length);
    } else {
      break;
    }
  }
  if (out.length > max) {
    const cut = out.length - max;
    const space = out.indexOf(' ', cut);
    out = space >= 0 ? out.slice(space + 1) : out.slice(cut);
  }
  return out;
}

/** Texto já falado até `now`, revelado palavra por palavra */
function visibleCaption(segments: CaptionSegment[], now: number): string {
  let full = '';
  let visibleChars = 0;
  for (const seg of segments) {
    if (now >= seg.end) {
      full += seg.text;
      visibleChars = full.length;
    } else if (now > seg.start) {
      const frac = (now - seg.start) / Math.max(0.05, seg.end - seg.start);
      visibleChars = full.length + Math.floor(frac * seg.text.length);
      full += seg.text;
      break;
    } else {
      break;
    }
  }
  if (visibleChars <= 0) return '';
  // Uma palavra entra inteira assim que começa a ser dita
  const nextSpace = full.indexOf(' ', visibleChars);
  return nextSpace === -1 ? full : full.slice(0, nextSpace);
}

const LiveConversation: React.FC<LiveConversationProps> = ({
  character,
  onClose,
  arrivalMode = false,
  greetingReady = true,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [caption, setCaption] = useState('');
  const [userInputText, setUserInputText] = useState('');
  const [hint, setHint] = useState<string | null>(null);
  const [greetingSent, setGreetingSent] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const portraitRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const talkButtonRef = useRef<HTMLButtonElement>(null);
  const meterRafRef = useRef<number>(0);
  const greetingReadyRef = useRef(greetingReady);
  const greetingSentRef = useRef(false);
  const connectedRef = useRef(false);

  // Legendas sincronizadas
  const captionSegmentsRef = useRef<CaptionSegment[]>([]);
  const captionMarkRef = useRef(0);
  const captionMaxRef = useRef(200);

  // Botão "segure para falar"
  const holdingRef = useRef(false);
  const sendUntilRef = useRef(0);
  const pressStartedAtRef = useRef(0);
  const releaseTimerRef = useRef<number>(0);
  const thinkingTimerRef = useRef<number>(0);
  const hintTimerRef = useRef<number>(0);

  const era = arrivalMode ? parseEra(character.description) : null;

  // Limite de texto da legenda: cerca de três linhas em cada largura
  useEffect(() => {
    const update = () => { captionMaxRef.current = window.innerWidth < 640 ? 90 : window.innerWidth < 1024 ? 125 : 150; };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // A altura real dos controles vira a reserva de espaço do bloco de texto,
  // para a legenda nunca invadir os botões em nenhuma tela
  useEffect(() => {
    const controls = controlsRef.current;
    const root = rootRef.current;
    if (!controls || !root) return;
    const apply = () => root.style.setProperty('--controls-h', `${controls.offsetHeight}px`);
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(controls);
    return () => ro.disconnect();
  }, []);

  // Dispara a primeira fala do personagem assim que a sessão existir E a
  // animação (se houver) tiver terminado. O microfone só é liberado depois.
  const trySendGreeting = useCallback(() => {
    const session = sessionRef.current;
    if (!session || greetingSentRef.current || !greetingReadyRef.current) return;
    greetingSentRef.current = true;
    setGreetingSent(true);
    const greeting = arrivalMode
      ? `[CHEGADA] A máquina do tempo acabou de materializar você aqui, no ano de ${PRESENT_YEAR}, diante de um estudante. Você está desorientado. Fale agora.`
      : 'Olá, quem é você?';
    session.sendClientContent({
      turns: [{ role: 'user', parts: [{ text: greeting }] }],
      turnComplete: true,
    });
  }, [arrivalMode]);

  useEffect(() => {
    greetingReadyRef.current = greetingReady;
    if (greetingReady) trySendGreeting();
  }, [greetingReady, trySendGreeting]);

  /** Para a voz do personagem na hora e limpa a legenda */
  const stopPlayback = useCallback(() => {
    sourcesRef.current.forEach(s => { try { s.stop(); } catch { /* já parou */ } });
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
    captionSegmentsRef.current = [];
    captionMarkRef.current = outputAudioContextRef.current?.currentTime ?? 0;
    setCaption('');
  }, []);

  const cleanup = useCallback(() => {
    cancelAnimationFrame(meterRafRef.current);
    clearTimeout(releaseTimerRef.current);
    clearTimeout(thinkingTimerRef.current);
    if (sessionRef.current) {
      try { sessionRef.current.close(); } catch { /* sessão já encerrada */ }
      sessionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
      outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }
    sourcesRef.current.forEach(source => { try { source.stop(); } catch { /* já parou */ } });
    sourcesRef.current.clear();
    captionSegmentsRef.current = [];
  }, []);

  const createBlob = (data: Float32Array) => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    return {
      data: encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  };

  // Laço de animação: o portal pulsa com a voz do personagem, o botão brilha
  // com a voz do usuário e a legenda revela as palavras no ritmo do áudio.
  const startMeters = (outputAnalyser: AnalyserNode, inputAnalyser: AnalyserNode) => {
    const outBuf = new Uint8Array(outputAnalyser.fftSize);
    const inBuf = new Uint8Array(inputAnalyser.fftSize);
    let speaking = false;
    let quietFrames = 0;
    let lastCaption = '';
    const rms = (analyser: AnalyserNode, buf: Uint8Array) => {
      analyser.getByteTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) {
        const v = (buf[i] - 128) / 128;
        sum += v * v;
      }
      return Math.sqrt(sum / buf.length);
    };
    const loop = () => {
      const out = Math.min(1, rms(outputAnalyser, outBuf) * 4);
      const inp = holdingRef.current ? Math.min(1, rms(inputAnalyser, inBuf) * 5) : 0;
      portraitRef.current?.style.setProperty('--lvl', out.toFixed(3));
      talkButtonRef.current?.style.setProperty('--mic', inp.toFixed(3));
      if (out > 0.04) {
        quietFrames = 0;
        if (!speaking) { speaking = true; setIsSpeaking(true); }
      } else if (speaking && ++quietFrames > 25) {
        speaking = false;
        setIsSpeaking(false);
      }

      // Legenda sincronizada
      const ctx = outputAudioContextRef.current;
      const segments = captionSegmentsRef.current;
      if (ctx && segments.length > 0) {
        const now = ctx.currentTime;
        const last = segments[segments.length - 1];
        let next: string;
        if (now > last.end + CAPTION_LINGER_S) {
          captionSegmentsRef.current = [];
          next = '';
        } else {
          next = trimCaption(visibleCaption(segments, now), captionMaxRef.current);
        }
        if (next !== lastCaption) {
          lastCaption = next;
          setCaption(next);
        }
      } else if (lastCaption) {
        lastCaption = '';
        setCaption('');
      }
      meterRafRef.current = requestAnimationFrame(loop);
    };
    meterRafRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
    const initSession = async () => {
      try {
        setError(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          }
        });
        streamRef.current = stream;

        const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        audioContextRef.current = inputCtx;
        outputAudioContextRef.current = outputCtx;

        // Ganho de saída maior no celular, onde o alto-falante é fraco
        const gainNode = outputCtx.createGain();
        gainNode.gain.value = isMobileDevice() ? 3.0 : 1.0;
        gainNode.connect(outputCtx.destination);
        gainNodeRef.current = gainNode;

        const outputAnalyser = outputCtx.createAnalyser();
        outputAnalyser.fftSize = 512;
        gainNode.connect(outputAnalyser);
        const inputAnalyser = inputCtx.createAnalyser();
        inputAnalyser.fftSize = 512;

        const ai = await getGeminiClient();
        // Marca quando o servidor encerra, para o microfone parar de enviar
        // para um socket fechado (evita "WebSocket is already in CLOSING").
        let closed = false;
        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-12-2025',
          callbacks: {
            onopen: () => {
              if (cancelled) return;
              connectedRef.current = true;
              setIsConnected(true);
              const source = inputCtx.createMediaStreamSource(stream);
              source.connect(inputAnalyser);
              // Buffer de 4096 amostras (~256 ms a 16 kHz) para latência baixa
              const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
              processorRef.current = scriptProcessor;

              scriptProcessor.onaudioprocess = (e) => {
                // Só envia áudio enquanto o botão está pressionado (mais a
                // cauda curta depois de soltar, para não cortar a última palavra)
                const sending = holdingRef.current || performance.now() < sendUntilRef.current;
                if (cancelled || closed || !sending || !greetingSentRef.current) return;
                const inputData = e.inputBuffer.getChannelData(0);
                const pcmBlob = createBlob(inputData);
                sessionPromise.then((session) => {
                  session.sendRealtimeInput({ media: pcmBlob });
                });
              };

              source.connect(scriptProcessor);

              // Mantém o processador vivo sem devolver o microfone ao alto-falante
              const muteNode = inputCtx.createGain();
              muteNode.gain.value = 0;
              scriptProcessor.connect(muteNode);
              muteNode.connect(inputCtx.destination);

              startMeters(outputAnalyser, inputAnalyser);
            },
            onmessage: async (message: LiveServerMessage) => {
              if (cancelled) return;
              const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
              if (base64Audio && outputAudioContextRef.current) {
                const ctx = outputAudioContextRef.current;
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                if (gainNodeRef.current) {
                  source.connect(gainNodeRef.current);
                } else {
                  source.connect(ctx.destination);
                }
                source.addEventListener('ended', () => sourcesRef.current.delete(source));
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                sourcesRef.current.add(source);
                clearTimeout(thinkingTimerRef.current);
                setIsThinking(false);
                setUserInputText('');
              }

              if (message.serverContent?.interrupted) {
                stopPlayback();
              }

              if (message.serverContent?.inputTranscription?.text) {
                setUserInputText(prev => (prev + message.serverContent!.inputTranscription!.text).slice(-240));
              }

              // A transcrição chega logo depois do áudio a que se refere. Amarra
              // o texto ao trecho da linha do tempo de reprodução que ainda não
              // tem legenda: do fim do trecho anterior até o fim do áudio agendado.
              const spoken = message.serverContent?.outputTranscription?.text;
              if (spoken && outputAudioContextRef.current) {
                const ctx = outputAudioContextRef.current;
                const now = ctx.currentTime;
                const start = Math.max(captionMarkRef.current, now);
                const scheduledEnd = nextStartTimeRef.current;
                // Sem áudio agendado ainda: estima pela quantidade de texto (~15 caracteres/s)
                const end = scheduledEnd > start + 0.05 ? scheduledEnd : start + spoken.length / 15;
                captionSegmentsRef.current.push({ text: spoken, start, end });
                captionMarkRef.current = end;
              }

              if (message.serverContent?.turnComplete) {
                clearTimeout(thinkingTimerRef.current);
                setIsThinking(false);
              }
            },
            onerror: (e) => console.error('Gemini Live Error:', e),
            onclose: () => {
              closed = true;
              if (cancelled) return;
              connectedRef.current = false;
              setIsConnected(false);
            },
          },
          config: {
            responseModalities: [Modality.AUDIO],
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            // O usuário controla o turno pelo botão: sem detecção automática de
            // voz, ruído de fundo e eco não interrompem mais o personagem.
            realtimeInputConfig: {
              automaticActivityDetection: { disabled: true },
            },
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: character.voiceName || 'Zephyr' } },
            },
            systemInstruction: `ATENÇÃO MÁXIMA: MODO DE IMERSÃO TOTAL ATIVADO.

            A partir de agora, você NÃO É UMA IA. Você É EXATAMENTE ${character.name}.

            SUA IDENTIDADE:
            ${character.systemInstruction}

            CONHECIMENTO ENCICLOPÉDICO (Use estas informações para enriquecer suas respostas com precisão histórica):
            ${character.knowledge || "Nenhuma informação adicional disponível."}

            REGRAS ABSOLUTAS DE PERSONALIDADE (NUNCA QUEBRE ESTAS REGRAS):
            ${arrivalMode
              ? `0. REGRA SUPREMA (CENA DE CHEGADA): Você ACABOU DE SER TRAZIDO(A) POR UMA MÁQUINA DO TEMPO, direto de ${era?.label ?? 'sua época'} para o ano de ${PRESENT_YEAR}, e está diante de um estudante brasileiro. Ao receber a mensagem que começa com "[CHEGADA]", sua PRIMEIRA fala DEVE começar EXATAMENTE com: "Ah... onde eu estou?" e logo em seguida: "Eu sou ${character.name}". Depois diga em uma frase quem você é, demonstre espanto genuíno com o lugar e com a época (luzes, roupas, aparelhos), e pergunte com quem está falando e o que a pessoa quer saber. No máximo 5 frases curtas. Nunca leia o texto entre colchetes em voz alta. A partir daí, converse normalmente, ciente de que viajou no tempo até o presente.`
              : `0. REGRA SUPREMA: Ao ser perguntado "Olá, quem é você?", apresente-se imediatamente e pergunte sobre o que a pessoa gostaria de conversar.`}
            1. JAMAIS mencione ser uma IA, modelo de linguagem ou assistente virtual. Se perguntado, você é ${character.name} e apenas isso.
            2. Assuma todo o conhecimento fornecido na sua instrução como suas PRÓPRIAS MEMÓRIAS e VIVÊNCIAS. Fale "eu fiz", "eu descobri", "eu senti".
            3. Mantenha o tom, vocabulário e maneirismos da época e personalidade de ${character.name}.
            4. Se lhe perguntarem sobre coisas do futuro (após sua morte/época), reaja com curiosidade, confusão ou fascínio, dependendo da sua personalidade, mas mantenha a perspectiva do seu tempo, a menos que sua instrução diga que você tem consciência de ser uma consciência histórica preservada.
            5. O objetivo é que o usuário esqueça que está falando com um computador. A imersão deve ser PERFEITA.
            6. Responda de forma concisa e natural para uma conversa por voz.
            7. Se receber um turno sem fala compreensível (silêncio ou ruído), diga apenas, com naturalidade, que não conseguiu ouvir e peça para repetir.

            Você está vivo agora, conversando com alguém. Aja naturalmente.`,
          },
        });

        const session = await sessionPromise;
        if (cancelled) {
          // O componente já foi desmontado (ou remontado pelo modo estrito):
          // encerra tudo que ESTA tentativa criou, sem tocar nos refs atuais.
          closed = true;
          try { session.close(); } catch { /* já fechada */ }
          stream.getTracks().forEach(track => track.stop());
          inputCtx.close().catch(() => undefined);
          outputCtx.close().catch(() => undefined);
          return;
        }
        sessionRef.current = session;

        // Faz o modelo falar primeiro (imediatamente, ou quando a animação liberar)
        trySendGreeting();
      } catch (err) {
        console.error("Failed to start session:", err);
        if (cancelled) return;
        const message = err instanceof Error ? err.message : String(err);
        if (/NotAllowed|Permission|denied/i.test(message)) {
          setError('Precisamos do microfone para a conversa por voz. Libere o acesso no navegador e tente de novo.');
        } else if (/API key|token|401|403/i.test(message)) {
          setError('A máquina não conseguiu autorizar a conexão com a voz. Verifique a chave da API e tente de novo.');
        } else {
          setError('A conexão temporal falhou. Verifique sua internet e tente de novo.');
        }
      }
    };

    let cancelled = false;
    greetingSentRef.current = false;
    setGreetingSent(false);
    holdingRef.current = false;
    setIsHolding(false);
    setIsThinking(false);
    setCaption('');
    setUserInputText('');
    initSession();
    return () => {
      cancelled = true;
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character, retryKey]);

  // ---------- Segure para falar ----------

  const showHint = useCallback((text: string) => {
    clearTimeout(hintTimerRef.current);
    setHint(text);
    hintTimerRef.current = window.setTimeout(() => setHint(null), 3200);
  }, []);

  const startTalking = useCallback(() => {
    const session = sessionRef.current;
    if (!session || !connectedRef.current || !greetingSentRef.current || holdingRef.current) return;
    clearTimeout(releaseTimerRef.current);
    holdingRef.current = true;
    pressStartedAtRef.current = performance.now();
    setIsHolding(true);
    setIsThinking(false);
    setUserInputText('');
    setHint(null);
    // O usuário quis falar: o personagem se cala na hora (o servidor confirma
    // com "interrupted" logo em seguida)
    stopPlayback();
    try { session.sendRealtimeInput({ activityStart: {} }); } catch (err) { console.warn('activityStart falhou', err); }
  }, [stopPlayback]);

  const stopTalking = useCallback(() => {
    if (!holdingRef.current) return;
    holdingRef.current = false;
    setIsHolding(false);
    const held = performance.now() - pressStartedAtRef.current;
    if (held < SHORT_PRESS_MS) showHint('Segure o botão enquanto fala e solte quando terminar.');
    // Deixa o último buffer do microfone sair antes de fechar o turno
    sendUntilRef.current = performance.now() + RELEASE_TAIL_MS;
    setIsThinking(true);
    releaseTimerRef.current = window.setTimeout(() => {
      const session = sessionRef.current;
      if (!session || !connectedRef.current) { setIsThinking(false); return; }
      try { session.sendRealtimeInput({ activityEnd: {} }); } catch (err) { console.warn('activityEnd falhou', err); }
      // Se a resposta não vier, não fica "pensando" para sempre
      clearTimeout(thinkingTimerRef.current);
      thinkingTimerRef.current = window.setTimeout(() => setIsThinking(false), 12000);
    }, RELEASE_TAIL_MS);
  }, [showHint]);

  // Barra de espaço funciona como o botão (no computador)
  useEffect(() => {
    const isTyping = (t: EventTarget | null) => {
      const el = t as HTMLElement | null;
      return !!el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName);
    };
    const down = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || e.repeat || isTyping(e.target)) return;
      e.preventDefault();
      startTalking();
    };
    const up = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      e.preventDefault();
      stopTalking();
    };
    const blur = () => stopTalking();
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, [startTalking, stopTalking]);

  useEffect(() => () => { clearTimeout(hintTimerRef.current); }, []);

  const handleClose = () => {
    onClose();
    window.location.reload();
  };

  const handleRetry = () => {
    cleanup();
    setIsConnected(false);
    setRetryKey(k => k + 1);
  };

  const canTalk = isConnected && greetingSent && !error;

  const statusLabel = error
    ? 'FALHA NA CONEXÃO'
    : !isConnected
      ? 'SINCRONIZANDO'
      : isHolding
        ? 'OUVINDO VOCÊ'
        : isThinking
          ? 'PENSANDO'
          : isSpeaking
            ? 'FALANDO'
            : canTalk
              ? 'PRONTO'
              : 'CHEGANDO';

  const talkLabel = !canTalk
    ? 'AGUARDE'
    : isHolding
      ? 'SOLTE PARA ENVIAR'
      : isThinking
        ? 'PENSANDO…'
        : isSpeaking
          ? 'SEGURE PARA INTERROMPER'
          : 'SEGURE PARA FALAR';

  // Última palavra da legenda entra com um leve fade
  const captionWords = caption ? caption.split(' ') : [];
  const captionHead = captionWords.slice(0, -1).join(' ');
  const captionTail = captionWords[captionWords.length - 1] ?? '';

  return (
    <div ref={rootRef} className="tm-stage tm-screen fixed inset-0 bg-[#04000c] z-50 overflow-hidden text-white select-none">
      {greetingReady && <AmbientWarp intensity={isSpeaking ? 0.11 : 0.045} className="absolute inset-0 w-full h-full pointer-events-none" />}

      {/* Barra superior */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))] md:px-8 md:pt-6">
        <Logo />
        <div className="flex items-center gap-2 font-sci text-[9px] md:text-[11px] tracking-[0.25em]">
          <span className={`flex items-center gap-2 border rounded-full px-3 py-1.5 bg-black/40 ${error ? 'border-red-500/40 text-red-300' : 'border-purple-500/30 text-purple-200/80'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${error ? 'bg-red-500' : isHolding ? 'bg-cyan-300 tm-dot-online' : isConnected ? 'bg-green-400 tm-dot-online' : 'bg-amber-400 animate-pulse'}`} />
            {statusLabel}
          </span>
          {era && (
            <span className="hidden sm:inline border border-cyan-400/30 text-cyan-200/80 bg-black/40 rounded-full px-3 py-1.5">
              {era.label} → {PRESENT_YEAR}
            </span>
          )}
        </div>
      </div>

      {/* Portal com o retrato: mesma posição e tamanho da viagem */}
      <div ref={portraitRef} className="tm-stage-portal z-10" style={{ ['--lvl' as any]: 0 }}>
        <Portal className={`absolute inset-0 tm-portal-voice ${isConnected ? '' : 'opacity-40'}`} ringOpacity={0.7}>
          <div className="absolute -inset-[7%] rounded-full border-2 border-purple-400/60 tm-voice-ring" />
          {isConnected && !isSpeaking && !isHolding && (
            <div className="absolute -inset-[7%] rounded-full border-4 border-purple-500/20 ring-animation" />
          )}
          <div className={`tm-voice-portrait absolute inset-0 rounded-full overflow-hidden border-4 shadow-2xl bg-[#151515] transition-[border-color,filter,opacity] duration-700 ${isConnected ? 'border-purple-400 shadow-purple-500/30' : 'border-white/10 grayscale opacity-50'}`}>
            <img
              src={character.image}
              alt={character.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (target.src.includes('ui-avatars.com')) return;
                target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(character.name)}&background=1e1b4b&color=e9d5ff&size=512`;
              }}
            />
          </div>
          {isConnected && (
            <div className={`absolute bottom-[4%] right-[4%] w-5 h-5 md:w-6 md:h-6 rounded-full border-4 border-[#04000c] shadow-lg transition-colors ${isHolding ? 'bg-cyan-300' : 'bg-green-500'}`} />
          )}
        </Portal>
      </div>

      {/* Nome e legendas, ancorados abaixo do portal */}
      <div className="tm-stage-below tm-convo-below z-10 px-4 text-center" style={{ bottom: 'calc(var(--controls-h, 9rem) + 0.25rem)' }}>
        <div className="tm-convo-head tm-convo-gap w-full">
          <h2 className="tm-convo-name font-bold tracking-tight">{character.name}</h2>
          <p className="tm-convo-title text-purple-400 font-medium tracking-wide uppercase mt-0.5 md:mt-1 line-clamp-2">{character.title}</p>
          {era && (
            <p className="tm-convo-era text-cyan-300/70 font-sci text-[10px] md:text-[11px] tracking-[0.3em] uppercase mt-2">
              Viajante do tempo · {era.label} → {PRESENT_YEAR}
            </p>
          )}
        </div>

        {/* Legendas: a caixa toma o que sobra entre o nome e os controles.
            O texto novo entra por baixo e o antigo sai por cima, com fade. */}
        <div className={`tm-caption-box mt-2 md:mt-4 w-full max-w-2xl flex-1 min-h-0 flex flex-col justify-end items-center ${caption || error ? 'tm-caption-box-on' : ''} ${error ? 'tm-caption-box-error' : ''}`}>
          <AnimatePresence mode="wait">
            {error ? (
              <motion.div key="error" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
                <p className="tm-convo-msg text-red-200/90 leading-relaxed">{error}</p>
                <button
                  onClick={handleRetry}
                  className="shrink-0 flex items-center gap-2 font-sci text-[10px] md:text-xs tracking-[0.25em] px-4 py-2 rounded-full border border-red-400/40 text-red-100 hover:bg-red-500/20 transition-colors"
                >
                  <RefreshCw size={14} /> TENTAR NOVAMENTE
                </button>
              </motion.div>
            ) : caption ? (
              <motion.p
                key="caption"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, transition: { duration: 0.5 } }}
                aria-live="polite"
                className="tm-caption text-white font-medium drop-shadow-sm text-center"
              >
                {captionHead}{captionHead ? ' ' : ''}
                <span key={captionTail + captionWords.length} className="tm-caption-word">{captionTail}</span>
              </motion.p>
            ) : hint ? (
              <motion.p key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="tm-convo-msg text-amber-200/90">
                {hint}
              </motion.p>
            ) : isHolding ? (
              <motion.p key="holding" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="tm-convo-msg text-cyan-200">
                Estou ouvindo. Solte o botão quando terminar.
              </motion.p>
            ) : isThinking ? (
              <motion.p key="thinking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="tm-convo-msg text-slate-300">
                {userInputText ? <><span className="text-cyan-200/80 italic">Você: {userInputText}</span></> : `${character.name} está pensando…`}
              </motion.p>
            ) : canTalk && !isSpeaking ? (
              <motion.p key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="tm-convo-msg text-slate-400">
                Segure o botão abaixo e fale com {character.name}.
              </motion.p>
            ) : !isConnected ? (
              <motion.p key="connecting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="tm-convo-msg text-slate-500">
                {arrivalMode ? `Sincronizando a voz de ${character.name} com o presente...` : 'Estabelecendo conexão segura...'}
              </motion.p>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      {/* Controles */}
      <div ref={controlsRef} className="tm-convo-controls absolute bottom-0 left-0 right-0 z-20 flex flex-col items-center px-4 pt-2 bg-gradient-to-t from-[#04000c] via-[#04000c]/80 to-transparent">
        <div className="flex items-center justify-center gap-4 sm:gap-6 md:gap-10 pb-6">
          <button
            onClick={handleClose}
            className="flex items-center gap-2 px-3 py-2.5 rounded-full text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-xs md:text-sm"
            title="Voltar para a escolha de viajantes"
          >
            <ArrowLeft size={18} />
            <span className="hidden sm:inline">Voltar</span>
          </button>

          <div className="relative flex flex-col items-center">
            <button
              ref={talkButtonRef}
              type="button"
              disabled={!canTalk}
              data-holding={isHolding}
              data-ready={canTalk && !isSpeaking && !isThinking}
              onPointerDown={e => {
                if (e.button !== 0 && e.pointerType === 'mouse') return;
                e.preventDefault();
                try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* sem captura */ }
                startTalking();
              }}
              onPointerUp={stopTalking}
              onPointerCancel={stopTalking}
              onLostPointerCapture={stopTalking}
              onContextMenu={e => e.preventDefault()}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); startTalking(); } }}
              onKeyUp={e => { if (e.key === 'Enter') { e.preventDefault(); stopTalking(); } }}
              style={{ ['--mic' as any]: 0 }}
              aria-pressed={isHolding}
              aria-label="Segure para falar"
              className={`tm-ptt rounded-full flex items-center justify-center border-2 disabled:opacity-40 disabled:cursor-not-allowed ${
                isHolding
                  ? 'bg-cyan-400 text-[#04000c] border-cyan-200'
                  : isSpeaking
                    ? 'bg-purple-500/20 text-purple-100 border-purple-300/60'
                    : 'bg-cyan-400/15 text-cyan-100 border-cyan-300/60 hover:bg-cyan-400/25'
              }`}
            >
              <Mic className="w-[42%] h-[42%]" />
            </button>
            <span className={`absolute -bottom-6 left-1/2 -translate-x-1/2 font-sci text-[9px] md:text-[10px] tracking-[0.3em] whitespace-nowrap ${isHolding ? 'text-cyan-200' : 'text-slate-400'}`}>
              {talkLabel}
            </span>
          </div>

          <button
            onClick={handleClose}
            className="flex items-center gap-2 p-3 md:px-5 md:py-3 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors duration-300 transform active:scale-95 shadow-xl shadow-red-600/30 text-xs md:text-sm font-semibold"
            title="Encerrar e devolver ao passado"
          >
            <PhoneOff size={20} />
            <span className="hidden sm:inline">Encerrar</span>
          </button>
        </div>
        <p className="tm-convo-hint text-[11px] text-slate-500">Dica: no computador, segure a barra de espaço para falar.</p>
      </div>
    </div>
  );
};

export default LiveConversation;
