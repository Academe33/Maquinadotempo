
import React from 'react';
import { Character } from '../types';

interface CharacterCardProps {
  character: Character;
  onClick: (char: Character) => void;
}

const CharacterCard: React.FC<CharacterCardProps> = ({ character, onClick }) => {
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    // Prevent infinite loop by checking if we already retried or set fallback
    if (target.src.includes('ui-avatars.com')) return;
    
    // Fallback to UI Avatars if original image fails
    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(character.name)}&background=random&size=256`;
  };

  return (
    <div 
      onClick={() => onClick(character)}
      className="bg-[#121212] border border-[#262626] p-6 rounded-2xl flex flex-col items-center text-center hover:border-primary/50 hover:bg-[#161616] transition-all duration-300 cursor-pointer group shadow-lg hover:shadow-primary/5"
    >
      <div className="relative mb-5">
        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-slate-800 group-hover:border-primary transition-colors duration-300 relative z-10 bg-[#0a0a0a]">
          <img 
            src={character.image} 
            alt={character.name} 
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
            onError={handleImageError}
          />
        </div>
      </div>
      <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors duration-300">{character.name}</h3>
      <p className="text-purple-400/80 text-xs font-semibold uppercase tracking-wider mb-2">{character.title.split(',')[0]}</p>
      <p className="text-slate-400 text-xs leading-relaxed line-clamp-2 italic">
        "{character.description}"
      </p>
    </div>
  );
};

export default CharacterCard;
