import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Character } from '../types';
import { getGeminiClient, encode, decode, decodeAudioData } from '../services/gemini';
import { LiveServerMessage, Modality } from '@google/genai';
import { Mic, MicOff, PhoneOff, RefreshCw, ArrowLeft } from 'lucide-react';
import Logo from './Logo';
import AmbientWarp from './TimeMachine/AmbientWarp';
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

const LiveConversation: React.FC<LiveConversationProps> = ({
  character,
  onClose,
  arrivalMode = false,
  greetingReady = true,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [currentModelText, setCurrentModelText] = useState("");
  const [userInputText, setUserInputText] = useState("");

  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const portraitRef = useRef<HTMLDivElement>(null);
  const micButtonRef = useRef<HTMLButtonElement>(null);
  const meterRafRef = useRef<number>(0);
  const isMutedRef = useRef(isMuted);
  const greetingReadyRef = useRef(greetingReady);
  const greetingSentRef = useRef(false);

  const era = arrivalMode ? parseEra(character.description) : null;

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // Dispara a primeira fala do personagem assim que a sessão existir E a
  // animação (se houver) tiver terminado. O microfone só é liberado depois.
  const trySendGreeting = useCallback(() => {
    const session = sessionRef.current;
    if (!session || greetingSentRef.current || !greetingReadyRef.current) return;
    greetingSentRef.current = true;
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

  useEffect(() => {
    if (textContainerRef.current) {
      textContainerRef.current.scrollTop = textContainerRef.current.scrollHeight;
    }
  }, [currentModelText]);

  const cleanup = useCallback(() => {
    cancelAnimationFrame(meterRafRef.current);
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
    sourcesRef.current.forEach(source => source.stop());
    sourcesRef.current.clear();
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

  // Medidores de volume: o retrato pulsa com a voz do personagem e o botão
  // do microfone brilha com a voz do usuário. Sem re-render: só variáveis CSS.
  const startMeters = (outputAnalyser: AnalyserNode, inputAnalyser: AnalyserNode) => {
    const outBuf = new Uint8Array(outputAnalyser.fftSize);
    const inBuf = new Uint8Array(inputAnalyser.fftSize);
    let speaking = false;
    let quietFrames = 0;
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
      const inp = isMutedRef.current ? 0 : Math.min(1, rms(inputAnalyser, inBuf) * 5);
      portraitRef.current?.style.setProperty('--lvl', out.toFixed(3));
      micButtonRef.current?.style.setProperty('--mic', inp.toFixed(3));
      if (out > 0.04) {
        quietFrames = 0;
        if (!speaking) { speaking = true; setIsSpeaking(true); }
      } else if (speaking && ++quietFrames > 25) {
        speaking = false;
        setIsSpeaking(false);
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

        // Setup Master Volume Gain for louder mobile output
        const gainNode = outputCtx.createGain();
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        gainNode.gain.value = isMobile ? 3.0 : 1.0; // Boost volume 3x on mobile, standard on desktop
        gainNode.connect(outputCtx.destination);
        gainNodeRef.current = gainNode;

        const outputAnalyser = outputCtx.createAnalyser();
        outputAnalyser.fftSize = 512;
        gainNode.connect(outputAnalyser);
        const inputAnalyser = inputCtx.createAnalyser();
        inputAnalyser.fftSize = 512;

        const ai = await getGeminiClient();
        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-12-2025',
          callbacks: {
            onopen: () => {
              setIsConnected(true);
              const source = inputCtx.createMediaStreamSource(stream);
              source.connect(inputAnalyser);
              // Reduced buffer size to 4096 to lower latency (approx 256ms at 16kHz)
              const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
              processorRef.current = scriptProcessor;

              scriptProcessor.onaudioprocess = (e) => {
                // Segura o microfone até o personagem ter feito a primeira fala
                if (isMutedRef.current || !greetingSentRef.current) return;
                const inputData = e.inputBuffer.getChannelData(0);
                const pcmBlob = createBlob(inputData);
                sessionPromise.then((session) => {
                  session.sendRealtimeInput({ media: pcmBlob });
                });
              };

              source.connect(scriptProcessor);

              // Connect scriptProcessor to a mute gain node to keep it alive
              // but prevent audio feedback/monitoring
              const muteNode = inputCtx.createGain();
              muteNode.gain.value = 0;
              scriptProcessor.connect(muteNode);
              muteNode.connect(inputCtx.destination);

              startMeters(outputAnalyser, inputAnalyser);
            },
            onmessage: async (message: LiveServerMessage) => {
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
              }

              if (message.serverContent?.interrupted) {
                sourcesRef.current.forEach(s => s.stop());
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
              }

              if (message.serverContent?.inputTranscription) {
                setUserInputText(message.serverContent.inputTranscription.text);
              }
              if (message.serverContent?.outputTranscription) {
                setCurrentModelText(prev => prev + message.serverContent!.outputTranscription!.text);
              }
              if (message.serverContent?.turnComplete) {
                setTimeout(() => {
                   setUserInputText("");
                   setCurrentModelText("");
                }, 4000);
              }
            },
            onerror: (e) => console.error('Gemini Live Error:', e),
            onclose: () => setIsConnected(false),
          },
          config: {
            responseModalities: [Modality.AUDIO],
            inputAudioTranscription: {},
            outputAudioTranscription: {},
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

            Você está vivo agora, conversando com alguém. Aja naturalmente.`,
          },
        });

        const session = await sessionPromise;
        if (cancelled) {
          session.close();
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
    initSession();
    return () => {
      cancelled = true;
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character, retryKey]);

  const handleClose = () => {
    onClose();
    window.location.reload();
  };

  const handleRetry = () => {
    cleanup();
    setIsConnected(false);
    setRetryKey(k => k + 1);
  };

  const statusLabel = error
    ? 'FALHA NA CONEXÃO'
    : !isConnected
      ? 'SINCRONIZANDO'
      : isSpeaking
        ? 'FALANDO'
        : isMuted
          ? 'MICROFONE MUDO'
          : 'OUVINDO VOCÊ';

  return (
    <div className="fixed inset-0 bg-[#04000c] z-50 flex flex-col overflow-hidden text-white">
      {greetingReady && <AmbientWarp intensity={isSpeaking ? 0.11 : 0.045} className="absolute inset-0 w-full h-full pointer-events-none" />}

      {/* Barra superior */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-5 md:px-8 md:pt-6">
        <Logo />
        <div className="flex items-center gap-2 font-sci text-[9px] md:text-[11px] tracking-[0.25em]">
          <span className={`flex items-center gap-2 border rounded-full px-3 py-1.5 bg-black/40 ${error ? 'border-red-500/40 text-red-300' : 'border-purple-500/30 text-purple-200/80'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${error ? 'bg-red-500' : isConnected ? 'bg-green-400 tm-dot-online' : 'bg-amber-400 animate-pulse'}`} />
            {statusLabel}
          </span>
          {era && (
            <span className="hidden sm:inline border border-cyan-400/30 text-cyan-200/80 bg-black/40 rounded-full px-3 py-1.5">
              {era.label} → {PRESENT_YEAR}
            </span>
          )}
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="relative z-10 flex-1 min-h-0 flex flex-col items-center justify-center px-4 gap-5 md:gap-7">
        {/* Retrato */}
        <div ref={portraitRef} className="relative" style={{ ['--lvl' as any]: 0 }}>
          <div className="absolute -inset-4 md:-inset-6 rounded-full border-2 border-purple-400/60 tm-voice-ring" />
          <div className="absolute -inset-8 md:-inset-12 rounded-full border border-dashed border-cyan-300/25 tm-spin-slower" />
          {isConnected && !isMuted && !isSpeaking && (
            <div className="absolute -inset-4 rounded-full border-4 border-purple-500/20 ring-animation" />
          )}
          <div className={`tm-voice-portrait w-44 h-44 sm:w-56 sm:h-56 md:w-72 md:h-72 rounded-full overflow-hidden border-4 shadow-2xl bg-[#151515] transition-[border-color,filter,opacity] duration-700 ${isConnected ? 'border-purple-400 shadow-purple-500/30' : 'border-white/10 grayscale opacity-50'}`}>
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
            <div className="absolute bottom-2 right-2 md:bottom-4 md:right-4 bg-green-500 w-5 h-5 md:w-6 md:h-6 rounded-full border-4 border-[#04000c] shadow-lg" />
          )}
        </div>

        <div className="text-center max-w-3xl w-full">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">{character.name}</h2>
          <p className="text-purple-400 font-medium tracking-wide uppercase text-[11px] md:text-sm mt-1">{character.title}</p>
          {era && (
            <p className="text-cyan-300/70 font-sci text-[10px] md:text-[11px] tracking-[0.3em] uppercase mt-2">
              Viajante do tempo · {era.label} → {PRESENT_YEAR}
            </p>
          )}

          {/* Legendas */}
          <div className="mt-4 md:mt-6 min-h-[5.5rem] md:min-h-[6.5rem] flex items-center justify-center px-2 w-full">
            <div
              ref={textContainerRef}
              className="max-w-2xl w-full max-h-[6.5rem] md:max-h-[7.5rem] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] scroll-smooth"
            >
              <AnimatePresence mode="wait">
                {error ? (
                  <motion.div key="error" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-3">
                    <p className="text-red-200/90 text-sm md:text-base leading-relaxed">{error}</p>
                    <button
                      onClick={handleRetry}
                      className="flex items-center gap-2 font-sci text-[10px] md:text-xs tracking-[0.25em] px-4 py-2 rounded-full border border-red-400/40 text-red-100 hover:bg-red-500/20 transition-colors"
                    >
                      <RefreshCw size={14} /> TENTAR NOVAMENTE
                    </button>
                  </motion.div>
                ) : currentModelText ? (
                  <motion.p key="model" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-lg sm:text-xl md:text-2xl text-white font-medium leading-relaxed drop-shadow-sm text-center">
                    {currentModelText}
                  </motion.p>
                ) : userInputText ? (
                  <motion.p key="user" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-base md:text-xl text-cyan-200/80 italic">
                    Você: {userInputText}
                  </motion.p>
                ) : isConnected ? (
                  <motion.p key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-slate-400 text-sm md:text-lg animate-pulse">
                    {isMuted
                      ? 'Microfone silenciado. Toque no microfone para voltar a falar.'
                      : arrivalMode
                        ? `Pode falar. ${character.name} está ouvindo você.`
                        : 'Estou ouvindo você...'}
                  </motion.p>
                ) : (
                  <motion.p key="connecting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-slate-500 text-sm md:text-lg">
                    {arrivalMode ? `Sincronizando a voz de ${character.name} com o presente...` : 'Estabelecendo conexão segura...'}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Controles */}
      <div className="relative z-10 flex justify-center px-4 pt-2 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:pb-10">
        <div className="flex items-center gap-4 md:gap-8 px-4 md:px-8 py-2.5 md:py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl">
          <button
            onClick={handleClose}
            className="flex items-center gap-2 px-3 py-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors text-xs md:text-sm"
            title="Voltar para a escolha de viajantes"
          >
            <ArrowLeft size={18} />
            <span className="hidden sm:inline">Voltar</span>
          </button>

          <button
            ref={micButtonRef}
            onClick={() => setIsMuted(!isMuted)}
            style={{ ['--mic' as any]: 0 }}
            className={`tm-mic-glow p-4 md:p-5 rounded-full transition-colors duration-300 transform active:scale-90 ${isMuted ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-cyan-400/15 text-cyan-100 border border-cyan-300/40 hover:bg-cyan-400/25'}`}
            title={isMuted ? "Ativar Microfone" : "Silenciar Microfone"}
            aria-pressed={isMuted}
          >
            {isMuted ? <MicOff size={28} /> : <Mic size={28} />}
          </button>

          <button
            onClick={handleClose}
            className="flex items-center gap-2 p-4 md:px-5 md:py-4 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors duration-300 transform active:scale-95 shadow-xl shadow-red-600/30 text-xs md:text-sm font-semibold"
            title="Encerrar e devolver ao passado"
          >
            <PhoneOff size={22} />
            <span className="hidden sm:inline">Encerrar</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LiveConversation;
