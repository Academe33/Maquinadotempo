import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Character } from '../types';
import { INITIAL_CHARACTERS } from '../constants';

interface CharacterContextType {
  characters: Character[];
  updateCharacter: (id: string, updates: Partial<Character>) => void;
  resetCharacters: () => void;
}

const CharacterContext = createContext<CharacterContextType | undefined>(undefined);

export const CharacterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [characters, setCharacters] = useState<Character[]>(() => {
    const saved = localStorage.getItem('characters');
    return saved ? JSON.parse(saved) : INITIAL_CHARACTERS;
  });

  useEffect(() => {
    localStorage.setItem('characters', JSON.stringify(characters));
  }, [characters]);

  const updateCharacter = (id: string, updates: Partial<Character>) => {
    setCharacters(prev => prev.map(char => 
      char.id === id ? { ...char, ...updates } : char
    ));
  };

  const resetCharacters = () => {
    setCharacters(INITIAL_CHARACTERS);
    localStorage.removeItem('characters');
  };

  return (
    <CharacterContext.Provider value={{ characters, updateCharacter, resetCharacters }}>
      {children}
    </CharacterContext.Provider>
  );
};

export const useCharacters = () => {
  const context = useContext(CharacterContext);
  if (!context) {
    throw new Error('useCharacters must be used within a CharacterProvider');
  }
  return context;
};
