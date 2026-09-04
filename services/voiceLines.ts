// Falas fixas do app (máquina do tempo e chegada dos personagens).
// Centralizadas aqui para que o app e o script de pré-geração usem
// exatamente o mesmo texto — e portanto o mesmo arquivo em cache.

import { parseEra, PRESENT_YEAR } from './era.ts';

export interface VoiceLineCharacter {
  name: string;
  title: string;
  description: string;
  voiceName?: string;
}

export const spokenYear = (description: string) => {
  const era = parseEra(description);
  return era.bc ? `${Math.abs(era.targetYear)} antes de Cristo` : `${era.targetYear}`;
};

/** Falas do computador de bordo durante a viagem, na ordem em que acontecem */
export const machineLines = (c: VoiceLineCharacter) => {
  const year = spokenYear(c.description);
  return {
    scan: `Máquina do tempo ativada. Localizando ${c.name}.`,
    calibrate: `Alvo localizado. Destino: ano ${year}.`,
    charge: `Abrindo portal. Trazendo ${c.name} em três, dois, um.`,
    arrival: `Transferência concluída. ${c.name} chegou.`,
  };
};

/** Primeira fala do personagem ao chegar no presente */
export const arrivalLine = (c: VoiceLineCharacter) => {
  const year = spokenYear(c.description);
  const title = c.title.split(',')[0].trim().toLowerCase();
  return `Ah... onde eu estou? Eu sou ${c.name}, ${title}. Há um instante eu estava no ano de ${year}... e agora, que luzes são essas? Com quem estou falando?`;
};

/** Falas da tela inicial */
export const HOME_LINES = {
  welcome: `Bem-vindo à Máquina do Tempo. Escolha um viajante e eu vou buscá-lo no passado.`,
  sector: (sector: string) => `Setor: ${sector}.`,
};

/** Chave de voz ElevenLabs para um personagem (mapeada a partir da voz Gemini) */
export const characterVoiceKey = (c: VoiceLineCharacter) => c.voiceName || 'Zephyr';

export { PRESENT_YEAR };
