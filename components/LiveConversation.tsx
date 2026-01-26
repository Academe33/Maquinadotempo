
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Character } from '../types';
import { getGeminiClient, encode, decode, decodeAudioData } from '../services/gemini';
import { LiveServerMessage, Modality } from '@google/genai';
import { X, Mic, MicOff, PhoneOff } from 'lucide-react';
import Logo from './Logo';

interface LiveConversationProps {
  character: Character;
  onClose: () => void;
}

const LiveConversation: React.FC<LiveConversationProps> = ({ character, onClose }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
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
  const isMutedRef = useRef(isMuted);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    if (textContainerRef.current) {
      textContainerRef.current.scrollTop = textContainerRef.current.scrollHeight;
    }
  }, [currentModelText]);

  const cleanup = useCallback(() => {
    if (sessionRef.current) {
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

  useEffect(() => {
    const initSession = async () => {
      try {
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
        gainNode.gain.value = 1.0; // Standard volume (no boost)
        gainNode.connect(outputCtx.destination);
        gainNodeRef.current = gainNode;

        const ai = getGeminiClient();
        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-12-2025',
          callbacks: {
            onopen: () => {
              setIsConnected(true);
              const source = inputCtx.createMediaStreamSource(stream);
              // Reduced buffer size to 4096 to lower latency (approx 256ms at 16kHz)
              const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
              processorRef.current = scriptProcessor;

              scriptProcessor.onaudioprocess = (e) => {
                if (isMutedRef.current) return;
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
            },
            onmessage: async (message: LiveServerMessage) => {
              const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
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
            0. REGRA SUPREMA: Ao ser perguntado "Olá, quem é você?", apresente-se imediatamente e pergunte sobre o que a pessoa gostaria de conversar.
            1. JAMAIS mencione ser uma IA, modelo de linguagem ou assistente virtual. Se perguntado, você é ${character.name} e apenas isso.
            2. Assuma todo o conhecimento fornecido na sua instrução como suas PRÓPRIAS MEMÓRIAS e VIVÊNCIAS. Fale "eu fiz", "eu descobri", "eu senti".
            3. Mantenha o tom, vocabulário e maneirismos da época e personalidade de ${character.name}.
            4. Se lhe perguntarem sobre coisas do futuro (após sua morte/época), reaja com curiosidade, confusão ou fascínio, dependendo da sua personalidade, mas mantenha a perspectiva do seu tempo, a menos que sua instrução diga que você tem consciência de ser uma consciência histórica preservada.
            5. O objetivo é que o usuário esqueça que está falando com um computador. A imersão deve ser PERFEITA.
            6. Responda de forma concisa e natural para uma conversa por voz.
            
            Você está vivo agora, conversando com alguém. Aja naturalmente.`,
          },
        });

        sessionRef.current = await sessionPromise;
        
        // Trigger the model to speak first
        await sessionRef.current.send([{ text: "Olá, quem é você?" }], true);
      } catch (err) {
        console.error("Failed to start session:", err);
      }
    };

    initSession();
    return () => cleanup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character]);

  const handleClose = () => {
    onClose();
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] z-50 flex flex-col items-center justify-between p-4 md:p-8">
      {/* Logo */}
      <div className="absolute top-6 left-6 z-50">
        <Logo />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-6xl translate-y-[calc(15%_-_15px)]">
        
        {/* Visuals Container */}
        <div className="flex items-center justify-center mb-8 md:mb-12 w-full">
          
          {/* Character Avatar */}
          <div className="relative">
            {isConnected && !isMuted && (
              <div className="absolute -inset-4 rounded-full border-4 border-purple-500/20 ring-animation"></div>
            )}
            <div className={`w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden border-4 transition-all duration-700 shadow-2xl bg-[#151515] flex items-center justify-center ${isConnected ? 'border-purple-500 scale-105 shadow-purple-500/20' : 'border-white/10 grayscale opacity-40'}`}>
              <img 
                src={character.image} 
                alt={character.name} 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = character.image + "?retry=" + Date.now();
                }}
              />
            </div>
            {isConnected && (
              <div className="absolute bottom-4 right-4 bg-green-500 w-6 h-6 rounded-full border-4 border-[#0a0a0a] animate-pulse shadow-lg"></div>
            )}
          </div>
        </div>
        
        <div className="text-center mb-12 max-w-3xl w-full">
          <h2 className="text-4xl font-bold mb-3 tracking-tight">{character.name}</h2>
          <p className="text-purple-400 font-medium tracking-wide uppercase text-sm mb-6">{character.title}</p>
          
          {/* Subtitles Overlay */}
          <div className="min-h-[100px] flex items-center justify-center px-6 w-full">
            <div 
              ref={textContainerRef}
              className="max-w-2xl w-full h-[7.5rem] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] scroll-smooth"
            >
              {currentModelText ? (
                <div className="flex flex-col items-center">
                  <p className="text-2xl text-white font-medium leading-relaxed drop-shadow-sm text-center">
                    {currentModelText}
                  </p>
                </div>
              ) : userInputText ? (
                <p className="text-xl text-gray-400 italic">
                  Você: {userInputText}
                </p>
              ) : isConnected ? (
                <p className="text-gray-600 text-lg animate-pulse">
                  {isMuted ? "Microfone silenciado" : "Estou ouvindo você..."}
                </p>
              ) : (
                <p className="text-gray-700 text-lg">Estabelecendo conexão segura...</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Centralized Bottom Controls */}
      <div className="pb-12">
        <div className="flex items-center gap-8 px-8 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl translate-y-[15%]">
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className={`p-5 rounded-full transition-all duration-300 transform active:scale-90 ${isMuted ? 'bg-red-500/20 text-red-500 border border-red-500/40' : 'bg-white/10 hover:bg-white/20 text-white'}`}
            title={isMuted ? "Ativar Microfone" : "Silenciar Microfone"}
          >
            {isMuted ? <MicOff size={32} /> : <Mic size={32} />}
          </button>
          
          <button 
            onClick={handleClose}
            className="p-5 bg-red-600 hover:bg-red-700 text-white rounded-full transition-all duration-300 transform active:scale-95 shadow-xl shadow-red-600/30 hover:shadow-red-600/50"
            title="Encerrar Chamada"
          >
            <PhoneOff size={32} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LiveConversation;
