import { Character } from '../types';

export type HomeView = 'grade' | 'portal';

export interface HomeViewProps {
  characters: Character[];
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onSelectCharacter: (character: Character) => void;
  /** Texto da busca; quando preenchido, a lista ignora o setor e mostra os resultados */
  query?: string;
  onClearQuery?: () => void;
}

/** Sem acentos, minúsculo e sem espaços sobrando, para comparar buscas */
export const normalizeText = (text: string) =>
  text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

/** Verdadeiro se todas as palavras da busca aparecem no nome, título, feito ou setor */
export const matchesQuery = (character: Character, query: string) => {
  const words = normalizeText(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = normalizeText(`${character.name} ${character.title} ${character.description} ${character.category}`);
  return words.every(w => haystack.includes(w));
};

/** Ordena resultados: nome que começa com a busca primeiro, depois ordem alfabética */
export const searchCharacters = (characters: Character[], query: string) => {
  const q = normalizeText(query);
  if (!q) return characters;
  return characters
    .filter(c => matchesQuery(c, query))
    .sort((a, b) => {
      const aStarts = normalizeText(a.name).startsWith(q) ? 0 : 1;
      const bStarts = normalizeText(b.name).startsWith(q) ? 0 : 1;
      return aStarts - bStarts || a.name.localeCompare(b.name, 'pt-BR');
    });
};

/** Rótulo do setor sem o emoji ("📐 MATEMÁTICA" → "MATEMÁTICA") */
export const sectorLabel = (category: string) => category.replace(/^[^\p{L}\p{N}]+/u, '').trim();

/** Só o emoji do setor ("📐 MATEMÁTICA" → "📐") */
export const sectorEmoji = (category: string) => category.match(/^[^\p{L}\p{N}]+/u)?.[0].trim() ?? '';

/** Separa "feito" e "época" da descrição: "Teoria da relatividade (1879-1955)" */
export const splitDescription = (description: string) => {
  const match = description.match(/^(.*?)\s*\(([^)]*)\)\s*$/);
  if (!match) return { feat: description, years: null as string | null };
  return { feat: match[1], years: match[2].replace(/-/g, '–') };
};

export const fallbackAvatar = (name: string, size = 256) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1e1b4b&color=e9d5ff&size=${size}`;

export const readStored = (key: string) => {
  try { return localStorage.getItem(key); } catch { return null; }
};

export const writeStored = (key: string, value: string) => {
  try { localStorage.setItem(key, value); } catch { /* sem storage */ }
};
