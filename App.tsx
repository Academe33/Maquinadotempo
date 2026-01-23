import React, { useState, useMemo } from 'react';
import { Character } from './types';
import { INITIAL_CHARACTERS } from './constants';
import CharacterCard from './components/CharacterCard';
import LiveConversation from './components/LiveConversation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const ITEMS_PER_PAGE = 8;

const App: React.FC = () => {
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

  const categories = useMemo(() => {
    const cats = Array.from(new Set(INITIAL_CHARACTERS.map(c => c.category)));
    return ['Todos', ...cats];
  }, []);

  const filteredCharacters = useMemo(() => {
    if (selectedCategory === 'Todos') return INITIAL_CHARACTERS;
    return INITIAL_CHARACTERS.filter(c => c.category === selectedCategory);
  }, [selectedCategory]);

  const totalPages = Math.ceil(filteredCharacters.length / ITEMS_PER_PAGE);

  const currentCharacters = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCharacters.slice(start, start + ITEMS_PER_PAGE);
  }, [currentPage, filteredCharacters]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) handlePageChange(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) handlePageChange(currentPage + 1);
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
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto pt-20 px-6 text-center">
        <header className="mb-20">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 gradient-text">
            Com quem você quer falar hoje?
          </h1>
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
            Explore nossa curadoria de figuras históricas e mentes brilhantes preparadas para conversar com você em tempo real por voz.
          </p>
        </header>

        {/* Gallery Section - Paginated */}
        <section className="mb-24">
          <h2 className="text-4xl font-bold text-blue-500 mb-8">
            Galeria de Personalidades
          </h2>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-3 mb-10 max-w-5xl mx-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 scale-105'
                    : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-center gap-6 mb-12">
            <button 
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="p-3 rounded-full bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <span className="text-xl font-medium text-gray-300">
              {currentPage} de {totalPages}
            </span>
            <button 
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="p-3 rounded-full bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {currentCharacters.map((char) => (
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
      <footer className="mt-32 border-t border-white/5 py-16 text-center text-slate-600 bg-[#070707]">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-sm tracking-widest uppercase mb-2">PersonaChat Experience</p>
          <p className="text-xs">Powered by Gemini 2.5 Flash Native Audio</p>
        </div>
      </footer>
    </div>
  );
};

export default App;