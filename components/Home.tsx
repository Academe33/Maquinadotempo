import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MousePointerClick, Radar, Mic } from 'lucide-react';
import { Character } from '../types';
import { useCharacters } from '../contexts/CharacterContext';
import { PRESENT_YEAR } from '../services/era';
import CharacterCard from './CharacterCard';
import LiveConversation from './LiveConversation';
import TimeMachineIntro from './TimeMachine/TimeMachineIntro';
import AmbientWarp from './TimeMachine/AmbientWarp';
import Logo from './Logo';

const STEPS = [
  { icon: MousePointerClick, title: 'Escolha o viajante', text: 'Toque em quem você quer conhecer.' },
  { icon: Radar, title: 'A máquina cruza os séculos', text: 'Ela localiza a pessoa no passado e a traz até aqui.' },
  { icon: Mic, title: 'Converse por voz', text: 'A pessoa chega, se apresenta e responde ao vivo.' },
];

const Home: React.FC = () => {
  const { characters } = useCharacters();
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  // true depois que a máquina do tempo "entrega" o personagem no presente
  const [hasArrived, setHasArrived] = useState(false);

  const categories = useMemo(() => Array.from(new Set(characters.map(c => c.category))), [characters]);
  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0]);

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
    setHasArrived(false);
    setSelectedCharacter(char);
  };

  const handleClose = () => {
    setSelectedCharacter(null);
    setHasArrived(false);
  };

  // Rótulo do setor sem o emoji ("📐 MATEMÁTICA" → "MATEMÁTICA")
  const sectorName = selectedCategory?.replace(/^[^\p{L}\p{N}]+/u, '') ?? '';

  return (
    <>
      <AnimatePresence>
        {!selectedCharacter && (
          <motion.div
            key="home"
            className="min-h-screen text-white relative"
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

              {/* Como funciona */}
              <motion.ol
                className="mt-10 md:mt-12 grid grid-cols-3 gap-2 md:gap-4 max-w-3xl mx-auto"
                initial="hidden"
                animate="show"
                variants={{ show: { transition: { staggerChildren: 0.12, delayChildren: 0.5 } } }}
              >
                {STEPS.map((step, i) => (
                  <motion.li
                    key={step.title}
                    variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}
                    className="relative bg-[#0d0a18]/70 border border-purple-500/15 rounded-2xl px-2 py-3 md:px-4 md:py-4 text-center"
                  >
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 font-sci text-[9px] tracking-widest bg-purple-600 text-white rounded-full px-2 py-0.5">
                      0{i + 1}
                    </span>
                    <step.icon className="mx-auto mt-1 mb-2 text-cyan-300" size={20} />
                    <p className="text-[11px] md:text-sm font-semibold leading-tight">{step.title}</p>
                    <p className="hidden md:block text-xs text-slate-400 mt-1 leading-snug">{step.text}</p>
                  </motion.li>
                ))}
              </motion.ol>
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
                      onClick={() => setSelectedCategory(cat)}
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
