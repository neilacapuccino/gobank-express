export const MAX_STASHES = 5;
export const MAX_TRANSACTION_CENTAVOS = 100_000_000;
export const MAX_BALANCE_CENTAVOS = 2_147_483_647;
export const MAX_REWARD_POINTS = 2_147_483_647;
export const MIN_REDEEM_POINTS = 100;
const CENTAVOS_PER_POINT_EARNED = 5000;
const CENTAVOS_PER_POINT_REDEEMED = 1;

export const toCentavos = (pesos: number) => Math.round(pesos * 100);

export const toPesos = (centavos: number) => centavos / 100;

export const pointsEarned = (spent: number) =>
	Math.floor(spent / CENTAVOS_PER_POINT_EARNED);

export const pointsValue = (points: number) =>
	points * CENTAVOS_PER_POINT_REDEEMED;
