import React from 'react';
import { motion } from 'motion/react';
import { Character } from '../types';

interface CharacterCardProps {
  character: Character;
  index: number;
  onClick: (char: Character) => void;
}

// Separa "feito" e "época" da descrição: "Teoria da relatividade (1879-1955)"
const splitDescription = (description: string) => {
  const match = description.match(/^(.*?)\s*\(([^)]*)\)\s*$/);
  if (!match) return { feat: description, years: null as string | null };
  return { feat: match[1], years: match[2].replace(/-/g, '–') };
};

const CharacterCard: React.FC<CharacterCardProps> = ({ character, index, onClick }) => {
  const { feat, years } = splitDescription(character.description);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    if (target.src.includes('ui-avatars.com')) return;
    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(character.name)}&background=1e1b4b&color=e9d5ff&size=256`;
  };

  return (
    <motion.button
      type="button"
      layout
      initial={{ opacity: 0, y: 28, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.18 } }}
      transition={{ duration: 0.45, delay: Math.min(index, 11) * 0.045, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.96 }}
      onClick={() => onClick(character)}
      aria-label={`Trazer ${character.name} para o presente`}
      className="group relative text-left w-full bg-[#0d0a18]/80 backdrop-blur-sm border border-purple-500/15 hover:border-purple-400/60 rounded-2xl p-4 md:p-6 flex flex-col items-center text-center transition-colors duration-300 cursor-pointer shadow-lg hover:shadow-[0_0_40px_rgba(168,85,247,0.25)] focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
    >
      {/* Cantos do HUD */}
      <span className="pointer-events-none absolute top-2 left-2 w-3 h-3 border-t border-l border-purple-400/40 group-hover:border-cyan-300/80 transition-colors" />
      <span className="pointer-events-none absolute top-2 right-2 w-3 h-3 border-t border-r border-purple-400/40 group-hover:border-cyan-300/80 transition-colors" />
      <span className="pointer-events-none absolute bottom-2 left-2 w-3 h-3 border-b border-l border-purple-400/40 group-hover:border-cyan-300/80 transition-colors" />
      <span className="pointer-events-none absolute bottom-2 right-2 w-3 h-3 border-b border-r border-purple-400/40 group-hover:border-cyan-300/80 transition-colors" />

      {/* Cápsula com o retrato */}
      <div className="relative mb-4 md:mb-5">
        <div className="absolute -inset-3 rounded-full bg-purple-500/25 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute -inset-2 rounded-full border border-dashed border-purple-400/30 group-hover:border-cyan-300/60 tm-spin-slow" />
        <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 border-purple-900/80 group-hover:border-purple-300 transition-colors duration-300 relative z-10 bg-[#0a0a0a]">
          <img
            src={character.image}
            alt={character.name}
            referrerPolicy="no-referrer"
            loading="lazy"
            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500 grayscale-[35%] group-hover:grayscale-0"
            onError={handleImageError}
          />
        </div>
        {years && (
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap font-sci text-[9px] md:text-[10px] tracking-widest px-2 py-0.5 rounded-full bg-[#0a0a0a] border border-purple-500/40 text-purple-200 group-hover:border-cyan-300/70 group-hover:text-cyan-100 transition-colors">
            {years}
          </span>
        )}
      </div>

      <h3 className="text-sm md:text-lg font-bold mb-1 group-hover:text-purple-200 transition-colors duration-300 leading-tight">
        {character.name}
      </h3>
      <p className="text-purple-400/80 text-[10px] md:text-xs font-semibold uppercase tracking-wider mb-1.5">
        {character.title.split(',')[0]}
      </p>
      <p className="text-slate-400 text-[11px] md:text-xs leading-relaxed line-clamp-2 italic">
        {feat}
      </p>

      {/* Chamada para ação: sempre visível no celular, no hover no desktop */}
      <span className="mt-3 md:mt-4 font-sci text-[9px] md:text-[10px] tracking-[0.25em] text-cyan-300/80 md:opacity-0 md:translate-y-1 md:group-hover:opacity-100 md:group-hover:translate-y-0 transition-all duration-300">
        ▸ TRAZER PARA O PRESENTE
      </span>
    </motion.button>
  );
};

export default CharacterCard;
