export const MAX_STASHES = 5;
export const CENTAVOS_PER_POINT_EARNED = 5000;
export const CENTAVOS_PER_POINT_REDEEMED = 1;

export const toCentavos = (pesos: number) => Math.round(pesos * 100);

export const toPesos = (centavos: number) => centavos / 100;

export const pointsEarned = (spent: number) =>
  Math.floor(spent / CENTAVOS_PER_POINT_EARNED);

export const pointsValue = (points: number) =>
  points * CENTAVOS_PER_POINT_REDEEMED;
