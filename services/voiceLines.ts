// Falas fixas do app (computador de bordo da máquina do tempo e narração da
// home). A voz dos personagens é sempre a do motor de IA (Gemini Live),
// inclusive na primeira fala ao chegar.
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

/** Falas da tela inicial */
export const HOME_LINES = {
  welcome: `Bem-vindo à Máquina do Tempo. Escolha um viajante e eu vou buscá-lo no passado.`,
  sector: (sector: string) => `Setor: ${sector}.`,
};

export { PRESENT_YEAR };
