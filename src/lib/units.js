// Unidades de medida e conversão para a unidade-base (g, ml ou un)
export const UNITS = {
  kg: { family: 'massa', toBase: 1000, base: 'g', name: 'Quilo (kg)' },
  g: { family: 'massa', toBase: 1, base: 'g', name: 'Grama (g)' },
  l: { family: 'volume', toBase: 1000, base: 'ml', name: 'Litro (l)' },
  ml: { family: 'volume', toBase: 1, base: 'ml', name: 'Mililitro (ml)' },
  un: { family: 'contagem', toBase: 1, base: 'un', name: 'Unidade (un)' },
};

export const UNIT_KEYS = Object.keys(UNITS);

export const compatibleUnits = (unit) =>
  UNIT_KEYS.filter((k) => UNITS[k].family === UNITS[unit]?.family);

export const sameFamily = (a, b) => UNITS[a] && UNITS[b] && UNITS[a].family === UNITS[b].family;
