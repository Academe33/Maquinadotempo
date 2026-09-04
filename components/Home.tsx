import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, VolumeX } from 'lucide-react';
import { Character } from '../types';
import { useCharacters } from '../contexts/CharacterContext';
import { PRESENT_YEAR } from '../services/era';
import { HOME_LINES } from '../services/voiceLines';
import { fetchVoice, prefetchVoices, playBufferElement, Playback } from '../services/tts';
import CharacterCard from './CharacterCard';
import LiveConversation from './LiveConversation';
import TimeMachineIntro from './TimeMachine/TimeMachineIntro';
import AmbientWarp from './TimeMachine/AmbientWarp';
import Logo from './Logo';

// Rótulo do setor sem o emoji ("📐 MATEMÁTICA" → "MATEMÁTICA")
const sectorLabel = (category: string) => category.replace(/^[^\p{L}\p{N}]+/u, '').trim();

const readSoundPref = () => {
  try { return localStorage.getItem('tm-narration') !== 'off'; } catch { return true; }
};

const Home: React.FC = () => {
  const { characters } = useCharacters();
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  // true depois que a máquina do tempo "entrega" o personagem no presente
  const [hasArrived, setHasArrived] = useState(false);

  const categories = useMemo(() => Array.from(new Set(characters.map(c => c.category))), [characters]);
  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0]);

  // Narração da tela inicial (voz da máquina): boas-vindas no primeiro toque
  // e anúncio do setor ao trocar. Pode ser desligada e a escolha fica salva.
  const [narrationOn, setNarrationOn] = useState(readSoundPref);
  const narrationRef = useRef(narrationOn);
  const welcomedRef = useRef(false);
  const playbackRef = useRef<Playback | null>(null);

  useEffect(() => {
    narrationRef.current = narrationOn;
    try { localStorage.setItem('tm-narration', narrationOn ? 'on' : 'off'); } catch { /* sem storage */ }
    if (!narrationOn) playbackRef.current?.stop();
  }, [narrationOn]);

  useEffect(() => {
    prefetchVoices('machine', [HOME_LINES.welcome, ...categories.map(c => HOME_LINES.sector(sectorLabel(c)))]);
  }, [categories]);

  const narrate = useCallback(async (text: string) => {
    if (!narrationRef.current) return;
    try {
      const buffer = await fetchVoice('machine', text);
      if (!narrationRef.current) return;
      playbackRef.current?.stop();
      playbackRef.current = playBufferElement(buffer, 0.9);
    } catch (err) {
      console.warn('Narração indisponível:', (err as Error).message);
    }
  }, []);

  // Navegadores só tocam áudio depois de um gesto: a primeira interação que
  // não for escolher um viajante dispara as boas-vindas.
  const handleFirstInteraction = (e: React.PointerEvent) => {
    if (welcomedRef.current) return;
    if ((e.target as HTMLElement).closest('[data-card]')) return;
    welcomedRef.current = true;
    narrate(HOME_LINES.welcome);
  };

  const handleSelectCategory = (cat: string) => {
    if (cat === selectedCategory) return;
    setSelectedCategory(cat);
    welcomedRef.current = true;
    narrate(HOME_LINES.sector(sectorLabel(cat)));
  };

  useEffect(() => () => playbackRef.current?.stop(), []);

  useEffect(() => {
    if (!categories.includes(selectedCategory) && categories.length > 0) {
      setSelectedCategory(categories[0]);
    }
  }, [categories, selectedCategory]);

  const filteredCharacters = useMemo(
    () => characters.filter(c => c.category === selectedCategory),
    [selectedCategory, characters]
  );

  const handleSelectCharacter = (char: Character) => {
    playbackRef.current?.stop();
    setHasArrived(false);
    setSelectedCharacter(char);
  };

  const handleClose = () => {
    setSelectedCharacter(null);
    setHasArrived(false);
  };

  const sectorName = selectedCategory ? sectorLabel(selectedCategory) : '';

  return (
    <>
      <AnimatePresence>
        {!selectedCharacter && (
          <motion.div
            key="home"
            className="min-h-screen text-white relative"
            onPointerDownCapture={handleFirstInteraction}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.04, filter: 'blur(10px)', transition: { duration: 0.55 } }}
          >
            <AmbientWarp intensity={0.045} />

            {/* Barra superior */}
            <header className="relative z-10 flex items-center justify-between px-5 pt-5 md:px-8 md:pt-6">
              <Logo />
              <div className="flex items-center gap-2 md:gap-3 font-sci text-[9px] md:text-[11px] tracking-[0.25em] text-purple-200/80">
                <span className="flex items-center gap-2 border border-purple-500/30 bg-black/40 rounded-full px-3 py-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 tm-dot-online" />
                  SISTEMA ONLINE
                </span>
                <span className="hidden sm:inline border border-purple-500/30 bg-black/40 rounded-full px-3 py-1.5">
                  ANO {PRESENT_YEAR}
                </span>
                <button
                  type="button"
                  onClick={() => setNarrationOn(v => !v)}
                  aria-pressed={narrationOn}
                  title={narrationOn ? 'Desligar narração da máquina' : 'Ligar narração da máquina'}
                  className={`flex items-center gap-1.5 border rounded-full px-2.5 py-1.5 transition-colors ${narrationOn ? 'border-cyan-400/40 text-cyan-200 bg-black/40 hover:bg-cyan-400/10' : 'border-white/15 text-slate-500 bg-black/40 hover:text-slate-300'}`}
                >
                  {narrationOn ? <Volume2 size={13} /> : <VolumeX size={13} />}
                  <span className="hidden md:inline">NARRAÇÃO</span>
                </button>
              </div>
            </header>

            {/* Hero */}
            <section className="relative z-10 max-w-6xl mx-auto pt-12 md:pt-20 px-4 md:px-6 text-center">
              <motion.p
                className="font-sci text-[10px] md:text-xs tracking-[0.45em] text-cyan-300/80 mb-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                ▸ {characters.length} VIAJANTES DISPONÍVEIS
              </motion.p>
              <motion.h1
                className="text-[2.2rem] md:text-[4.125rem] font-sci font-black mb-5 gradient-text uppercase drop-shadow-[0_0_20px_rgba(168,85,247,0.4)] leading-tight"
                initial={{ opacity: 0, letterSpacing: '0.6em' }}
                animate={{ opacity: 1, letterSpacing: '0.18em' }}
                transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
              >
                Máquina do Tempo
              </motion.h1>
              <motion.p
                className="text-slate-300 text-base md:text-lg max-w-xl mx-auto font-light leading-relaxed"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                Escolha alguém do passado. A máquina vai buscá-lo na época em que viveu
                e trazê-lo para uma conversa por voz, ao vivo, com você.
              </motion.p>

            </section>

            {/* Seleção */}
            <section className="relative z-10 max-w-6xl mx-auto mt-12 md:mt-16 px-4 md:px-6 pb-16">
              {/* Setores */}
              <div className="flex items-center gap-3 mb-4 md:justify-center">
                <span className="font-sci text-[10px] md:text-xs tracking-[0.35em] text-purple-300/70">SETOR</span>
                <span className="h-px flex-1 md:flex-none md:w-24 bg-gradient-to-r from-purple-500/40 to-transparent" />
              </div>
              <div
                role="tablist"
                aria-label="Setores de conhecimento"
                className="flex flex-nowrap overflow-x-auto snap-x md:flex-wrap md:justify-center gap-2 mb-8 md:mb-10 w-full pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide"
              >
                {categories.map(cat => {
                  const active = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      role="tab"
                      aria-selected={active}
                      onClick={() => handleSelectCategory(cat)}
                      className={`relative px-3.5 py-2 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 snap-center transition-colors duration-300 ${
                        active ? 'text-white' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="sector-pill"
                          className="absolute inset-0 rounded-full bg-purple-600 shadow-lg shadow-purple-500/30"
                          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                        />
                      )}
                      {!active && <span className="absolute inset-0 rounded-full bg-white/5 border border-white/10" />}
                      <span className="relative">{cat}</span>
                    </button>
                  );
                })}
              </div>

              {/* Cabeçalho do setor */}
              <div className="flex items-baseline justify-between mb-5 md:mb-6">
                <AnimatePresence mode="wait">
                  <motion.h2
                    key={selectedCategory}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.25 }}
                    className="font-sci text-lg md:text-2xl font-bold text-purple-300 tracking-widest uppercase"
                  >
                    {sectorName}
                  </motion.h2>
                </AnimatePresence>
                <span className="font-sci text-[10px] md:text-xs tracking-[0.25em] text-slate-500">
                  {filteredCharacters.length} VIAJANTES
                </span>
              </div>

              {/* Cápsulas */}
              <motion.div layout className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
                <AnimatePresence mode="popLayout">
                  {filteredCharacters.map((char, i) => (
                    <CharacterCard key={char.id} character={char} index={i} onClick={handleSelectCharacter} />
                  ))}
                </AnimatePresence>
              </motion.div>
            </section>

            <footer className="relative z-10 border-t border-white/5 py-10 text-center text-slate-600 bg-[#050310]/80">
              <p className="font-sci text-[10px] tracking-[0.35em] uppercase mb-2 text-purple-300/50">Academe · Máquina do Tempo</p>
              <p className="text-xs">Vozes em tempo real com Gemini 2.5 Flash Native Audio</p>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>

      {selectedCharacter && (
        <>
          {/* A conversa conecta por baixo enquanto a máquina roda; a primeira
              fala do personagem só sai quando a animação termina. */}
          <LiveConversation
            character={selectedCharacter}
            onClose={handleClose}
            arrivalMode
            greetingReady={hasArrived}
          />
          <AnimatePresence>
            {!hasArrived && (
              <TimeMachineIntro
                key={selectedCharacter.id}
                character={selectedCharacter}
                onComplete={() => setHasArrived(true)}
              />
            )}
          </AnimatePresence>
        </>
      )}
    </>
  );
};

export default Home;
