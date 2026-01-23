import React, { useState, useMemo } from 'react';
import { Character } from './types';
import { INITIAL_CHARACTERS } from './constants';
import CharacterCard from './components/CharacterCard';
import LiveConversation from './components/LiveConversation';

const App: React.FC = () => {
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);

  const groupedCharacters = useMemo(() => {
    return INITIAL_CHARACTERS.reduce((acc, char) => {
      if (!acc[char.category]) {
        acc[char.category] = [];
      }
      acc[char.category].push(char);
      return acc;
    }, {} as Record<string, Character[]>);
  }, []);

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

        {/* Gallery Sections - Continuous Scroll */}
        <div className="space-y-24">
          {Object.entries(groupedCharacters).map(([category, chars]) => (
            <section key={category} className="text-left">
              <div className="flex items-center gap-4 mb-10 border-b border-white/5 pb-4">
                <h2 className="text-2xl md:text-3xl font-bold text-primary">
                  {category}
                </h2>
                <span className="bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full border border-primary/20">
                  {/* Fixed: Property 'length' does not exist on type 'unknown'. Cast chars to Character[] to access length. */}
                  {(chars as Character[]).length} PERSONAGENS
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {(chars as Character[]).map((char) => (
                  <CharacterCard 
                    key={char.id} 
                    character={char} 
                    onClick={setSelectedCharacter} 
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
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