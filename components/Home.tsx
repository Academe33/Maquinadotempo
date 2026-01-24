import React, { useState, useMemo } from 'react';
import { Character } from '../types';
import { useCharacters } from '../contexts/CharacterContext';
import CharacterCard from './CharacterCard';
import LiveConversation from './LiveConversation';
import Logo from './Logo';

const Home: React.FC = () => {
  const { characters } = useCharacters();
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  
  const categories = useMemo(() => {
    return Array.from(new Set(characters.map(c => c.category)));
  }, [characters]);

  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0]);

  // Update selected category if it doesn't exist anymore (e.g. after reset)
  React.useEffect(() => {
    if (!categories.includes(selectedCategory) && categories.length > 0) {
      setSelectedCategory(categories[0]);
    }
  }, [categories, selectedCategory]);

  const filteredCharacters = useMemo(() => {
    return characters.filter(c => c.category === selectedCategory);
  }, [selectedCategory, characters]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  if (selectedCharacter) {
    return (
      <LiveConversation 
        character={selectedCharacter} 
        onClose={() => setSelectedCharacter(null)} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white relative">
      {/* Logo */}
      <div className="absolute top-6 left-6 z-40">
        <Logo />
      </div>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto pt-24 px-6 text-center">
        <header className="mb-12">
          <h1 className="text-[2.5rem] md:text-[4.125rem] font-sci font-black mb-6 gradient-text uppercase tracking-widest drop-shadow-[0_0_20px_rgba(168,85,247,0.4)]">
            MÁQUINA DO TEMPO
          </h1>
          <p className="text-slate-400 text-base md:text-lg max-w-xl mx-auto font-light leading-relaxed">
            Converse com qualquer figura histórica e mentes brilhantes com você em tempo real por voz.
          </p>
        </header>

        {/* Gallery Section - Paginated */}
        <section className="mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-purple-500 mb-6">
            {selectedCategory}
          </h2>

          {/* Category Filter */}
          <div className="flex flex-nowrap overflow-x-auto snap-x snap-mandatory md:flex-wrap md:justify-center gap-2 md:gap-3 mb-6 md:mb-8 max-w-4xl mx-auto pb-2 px-4 md:px-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`px-3 py-1.5 md:px-3 md:py-1.5 rounded-full text-xs md:text-xs font-medium transition-all duration-300 whitespace-nowrap flex-shrink-0 snap-center ${
                  selectedCategory === cat
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25 scale-105'
                    : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {filteredCharacters.map((char) => (
              <CharacterCard 
                key={char.id} 
                character={char} 
                onClick={setSelectedCharacter} 
              />
            ))}
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="mt-24 border-t border-white/5 py-12 text-center text-slate-600 bg-[#070707]">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-sm tracking-widest uppercase mb-2">PersonaChat Experience</p>
          <p className="text-xs">Powered by Gemini 2.5 Flash Native Audio</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
