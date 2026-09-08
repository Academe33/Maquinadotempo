import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Character } from '../types';
import CharacterCard from './CharacterCard';
import { SearchX } from 'lucide-react';
import { HomeViewProps, sectorLabel, searchCharacters } from './homeShared';

/**
 * Visualização em grade (a home original): título, setores em chips e
 * cápsulas dos viajantes em cartões.
 */
const GridHome: React.FC<HomeViewProps> = ({ characters, categories, selectedCategory, onSelectCategory, onSelectCharacter, query = '', onClearQuery }) => {
  const searching = query.trim().length > 0;
  const filteredCharacters = useMemo(
    () => (searching ? searchCharacters(characters, query) : characters.filter(c => c.category === selectedCategory)),
    [selectedCategory, characters, query, searching]
  );
  const sectorName = selectedCategory ? sectorLabel(selectedCategory) : '';
  const heading = searching ? `Resultados para “${query.trim()}”` : sectorName;

  // Escolher um setor durante a busca volta para a navegação por setor
  const pickCategory = (cat: string) => {
    if (searching) onClearQuery?.();
    onSelectCategory(cat);
  };

  return (
    <>
      {/* Hero (sai de cena durante a busca para os resultados subirem) */}
      {!searching && (
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
      )}

      {/* Seleção */}
      <section className={`relative z-10 max-w-6xl mx-auto px-4 md:px-6 pb-16 ${searching ? 'mt-6 md:mt-8' : 'mt-12 md:mt-16'}`}>
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
            const active = !searching && selectedCategory === cat;
            return (
              <button
                key={cat}
                role="tab"
                aria-selected={active}
                onClick={() => pickCategory(cat)}
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
              key={searching ? 'search' : selectedCategory}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.25 }}
              className={`font-sci text-lg md:text-2xl font-bold tracking-widest uppercase ${searching ? 'text-cyan-300 normal-case tracking-wide' : 'text-purple-300'}`}
            >
              {heading}
            </motion.h2>
          </AnimatePresence>
          <span className="font-sci text-[10px] md:text-xs tracking-[0.25em] text-slate-500">
            {filteredCharacters.length} {filteredCharacters.length === 1 ? 'VIAJANTE' : 'VIAJANTES'}
          </span>
        </div>

        {searching && filteredCharacters.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center text-slate-400">
            <SearchX size={36} className="text-purple-400/70" />
            <p className="text-sm md:text-base">Nenhum viajante encontrado para “{query.trim()}”.</p>
            <button
              type="button"
              onClick={onClearQuery}
              className="font-sci text-[10px] md:text-xs tracking-[0.25em] px-4 py-2 rounded-full border border-cyan-400/40 text-cyan-100 hover:bg-cyan-400/10 transition-colors"
            >
              LIMPAR BUSCA
            </button>
          </div>
        )}

        {/* Cápsulas */}
        <motion.div layout className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
          <AnimatePresence mode="popLayout">
            {filteredCharacters.map((char, i) => (
              <CharacterCard key={char.id} character={char} index={i} onClick={onSelectCharacter} />
            ))}
          </AnimatePresence>
        </motion.div>
      </section>

      <footer className="relative z-10 border-t border-white/5 py-10 text-center text-slate-600 bg-[#050310]/80">
        <p className="font-sci text-[10px] tracking-[0.35em] uppercase mb-2 text-purple-300/50">Academe · Máquina do Tempo</p>
        <p className="text-xs">Vozes em tempo real com Gemini 2.5 Flash Native Audio</p>
      </footer>
    </>
  );
};

export default GridHome;
