import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Character } from '../types';
import { INITIAL_CHARACTERS } from '../constants';

interface CharacterContextType {
  characters: Character[];
  updateCharacter: (id: string, updates: Partial<Character>) => void;
  addCharacter: (character: Character) => void;
  deleteCharacter: (id: string) => void;
  resetCharacters: () => void;
}

const CharacterContext = createContext<CharacterContextType | undefined>(undefined);

export const CharacterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [characters, setCharacters] = useState<Character[]>(INITIAL_CHARACTERS);

  const updateCharacter = (id: string, updates: Partial<Character>) => {
    setCharacters(prev => prev.map(char => 
      char.id === id ? { ...char, ...updates } : char
    ));
  };

  const addCharacter = (character: Character) => {
    setCharacters(prev => [...prev, character]);
  };

  const deleteCharacter = (id: string) => {
    setCharacters(prev => prev.filter(char => char.id !== id));
  };

  const resetCharacters = () => {
    setCharacters(INITIAL_CHARACTERS);
  };

  return (
    <CharacterContext.Provider value={{ characters, updateCharacter, addCharacter, deleteCharacter, resetCharacters }}>
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
