import React, { useState, useMemo } from 'react';
import { Character } from './types';
import { CharacterProvider, useCharacters } from './contexts/CharacterContext';
import CharacterCard from './components/CharacterCard';
import LiveConversation from './components/LiveConversation';
import AdminPanel from './components/AdminPanel';
import { Settings } from 'lucide-react';

const AppContent: React.FC = () => {
  const { characters } = useCharacters();
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  
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
      {/* Admin Toggle */}
      <button 
        onClick={() => setShowAdmin(true)}
        className="fixed bottom-6 right-6 p-3 bg-zinc-900/50 hover:bg-red-900/50 text-zinc-500 hover:text-red-500 rounded-full transition-all duration-300 z-40 backdrop-blur-sm border border-zinc-800 hover:border-red-500/30"
        title="Painel Administrativo"
      >
        <Settings className="w-5 h-5" />
      </button>

      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}

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
            {selectedCategory}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
      <footer className="mt-32 border-t border-white/5 py-16 text-center text-slate-600 bg-[#070707]">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-sm tracking-widest uppercase mb-2">PersonaChat Experience</p>
          <p className="text-xs">Powered by Gemini 2.5 Flash Native Audio</p>
        </div>
      </footer>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <CharacterProvider>
      <AppContent />
    </CharacterProvider>
  );
};

export default App;