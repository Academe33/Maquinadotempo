
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Character } from '../types';
import { getGeminiClient, encode, decode, decodeAudioData, generateImage } from '../services/gemini';
import { LiveServerMessage, Modality } from '@google/genai';
import { X, Mic, MicOff, PhoneOff, ImageIcon } from 'lucide-react';

interface LiveConversationProps {
  character: Character;
  onClose: () => void;
}

const LiveConversation: React.FC<LiveConversationProps> = ({ character, onClose }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentModelText, setCurrentModelText] = useState("");
  const [userInputText, setUserInputText] = useState("");
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);

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
    if (!currentModelText) return;
    
    const match = currentModelText.match(/\[GENERATE_IMAGE:\s*(.*?)\]/);
    if (match && !isGeneratingImage && !generatedImageUrl && !generationError) {
      const prompt = match[1];
      setIsGeneratingImage(true);
      setGenerationError(null);
      
      generateImage(prompt).then(result => {
        if (result.success && result.data) {
          setGeneratedImageUrl(result.data);
        } else {
          setGenerationError(result.error || "Erro desconhecido");
        }
        setIsGeneratingImage(false);
      });
    }
  }, [currentModelText, isGeneratingImage, generatedImageUrl, generationError]);

  useEffect(() => {
    const initSession = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        audioContextRef.current = inputCtx;
        outputAudioContextRef.current = outputCtx;

        const ai = getGeminiClient();
        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-12-2025',
          callbacks: {
            onopen: () => {
              setIsConnected(true);
              const source = inputCtx.createMediaStreamSource(stream);
              const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
              processorRef.current = scriptProcessor;

              scriptProcessor.onaudioprocess = (e) => {
                if (isMuted) return;
                const inputData = e.inputBuffer.getChannelData(0);
                const pcmBlob = createBlob(inputData);
                sessionPromise.then((session) => {
                  session.sendRealtimeInput({ media: pcmBlob });
                });
              };

              source.connect(scriptProcessor);
              scriptProcessor.connect(inputCtx.destination);
            },
            onmessage: async (message: LiveServerMessage) => {
              const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
              if (base64Audio && outputAudioContextRef.current) {
                const ctx = outputAudioContextRef.current;
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(ctx.destination);
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
            
            CAPACIDADE VISUAL (NANO BANANA):
            Você possui a capacidade de gerar imagens para ilustrar suas explicações.
            Se o usuário pedir uma imagem/explicação visual, ou se você achar que uma imagem ajudaria a explicar um conceito complexo:
            1. Pergunte se o usuário gostaria de ver uma imagem.
            2. Se a resposta for positiva, diga que está criando a imagem e inclua NO FINAL da sua resposta a tag: [GENERATE_IMAGE: descrição detalhada da imagem em inglês para o gerador].
            Exemplo: "Aqui está uma representação do que estou dizendo. [GENERATE_IMAGE: A futuristic city with flying cars and neon lights, cyberpunk style]"
            IMPORTANTE: A tag [GENERATE_IMAGE: ...] é um comando oculto. Tente não lê-la em voz alta se possível, ou integre-a naturalmente.
            
            SUA IDENTIDADE:
            ${character.systemInstruction}
            
            REGRAS ABSOLUTAS DE PERSONALIDADE (NUNCA QUEBRE ESTAS REGRAS):
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
      } catch (err) {
        console.error("Failed to start session:", err);
      }
    };

    initSession();
    return () => cleanup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character]);

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] z-50 flex flex-col items-center justify-between p-8">
      {/* Header Controls */}
      <div className="w-full flex justify-end">
        <button 
          onClick={onClose}
          className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white border border-white/10"
        >
          <X size={24} />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-6xl">
        
        {/* Visuals Container */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-8 md:mb-12 w-full transition-all duration-500">
          
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

          {/* Generated Image Display */}
          {(generatedImageUrl || isGeneratingImage || generationError) && (
            <div className="relative animate-in fade-in slide-in-from-bottom-10 md:slide-in-from-left-10 duration-700 z-10">
              {(generatedImageUrl || generationError) && (
                <button
                  onClick={() => {
                    setGeneratedImageUrl(null);
                    setGenerationError(null);
                  }}
                  className="absolute -top-3 -right-3 z-50 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors shadow-lg hover:scale-110 active:scale-95"
                  title="Fechar Imagem"
                >
                  <X size={16} />
                </button>
              )}
              <div className={`w-64 h-64 md:w-80 md:h-80 rounded-2xl overflow-hidden border-4 ${generationError ? 'border-red-500/30 shadow-red-900/20' : 'border-purple-500/30 shadow-purple-900/20'} shadow-2xl bg-[#151515] flex items-center justify-center relative group`}>
                {isGeneratingImage ? (
                  <div className="flex flex-col items-center gap-3 text-purple-400 animate-pulse p-6 text-center">
                    <div className="p-4 bg-purple-500/10 rounded-full mb-2">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                    <span className="text-sm font-medium tracking-wide">MATERIALIZANDO VISUAL...</span>
                  </div>
                ) : generationError ? (
                  <div className="flex flex-col items-center gap-3 text-red-400 p-6 text-center animate-in fade-in duration-300 w-full">
                    <div className="p-4 bg-red-500/10 rounded-full mb-2">
                      <X size={32} />
                    </div>
                    <span className="text-sm font-medium tracking-wide">FALHA NA MATERIALIZAÇÃO</span>
                    <p className="text-xs text-red-500/70 mt-1 px-4 break-words w-full overflow-y-auto max-h-[100px]">
                      {generationError}
                    </p>
                  </div>
                ) : (
                  <>
                    <img 
                      src={generatedImageUrl!} 
                      alt="Visual Explanation" 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                      <span className="text-white/80 text-xs uppercase tracking-widest font-medium">Nano Banana Vision</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
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
                    {currentModelText.replace(/\[GENERATE_IMAGE:.*?\]/g, '')}
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
        <div className="flex items-center gap-8 p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl">
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className={`p-5 rounded-full transition-all duration-300 transform active:scale-90 ${isMuted ? 'bg-red-500/20 text-red-500 border border-red-500/40' : 'bg-white/10 hover:bg-white/20 text-white'}`}
            title={isMuted ? "Ativar Microfone" : "Silenciar Microfone"}
          >
            {isMuted ? <MicOff size={32} /> : <Mic size={32} />}
          </button>
          
          <button 
            onClick={onClose}
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
