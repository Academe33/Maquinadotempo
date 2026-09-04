// Extrai a "época" de um personagem a partir da descrição
// (ex.: "Teoria da relatividade (1879-1955)", "Idealismo (c. 428-348 a.C.)").
// A máquina do tempo usa isso para "calcular" o ano de destino.

export interface EraInfo {
  /** Ano de destino (negativo para a.C.) */
  targetYear: number;
  /** Ano de nascimento (negativo para a.C.), se conhecido */
  birth?: number;
  /** Ano de morte (negativo para a.C.), se conhecido */
  death?: number;
  /** Rótulo legível, ex.: "1921" ou "430 a.C." */
  label: string;
  /** Verdadeiro quando a época é antes de Cristo */
  bc: boolean;
  /** Verdadeiro quando a pessoa ainda está viva ("presente") */
  living: boolean;
}

export const PRESENT_YEAR = new Date().getFullYear();

export function formatYear(year: number): string {
  if (year < 0) return `${Math.abs(year)} a.C.`;
  return `${year}`;
}

export function parseEra(description: string): EraInfo {
  const inParens = description.match(/\(([^)]*)\)/)?.[1] ?? description;
  const bc = /a\.\s*C/i.test(inParens);
  const living = /presente|atual/i.test(inParens);
  const numbers = (inParens.match(/\d{1,4}/g) ?? []).map(Number);

  if (numbers.length === 0) {
    // Sem data conhecida: manda a máquina para um "passado indefinido"
    return { targetYear: 1900, label: '1900', bc: false, living: false };
  }

  const sign = bc ? -1 : 1;
  const birth = sign * numbers[0];
  const death = numbers.length > 1 ? sign * numbers[1] : undefined;

  let targetYear: number;
  if (death !== undefined) {
    // Vai buscar a pessoa no auge da vida, não no berço nem no leito de morte
    targetYear = Math.round(birth + (death - birth) * 0.55);
  } else if (living) {
    targetYear = Math.min(birth + 45, PRESENT_YEAR - 1);
  } else {
    targetYear = birth;
  }

  return {
    targetYear,
    birth,
    death,
    label: formatYear(targetYear),
    bc,
    living,
  };
}
