import { MIN_REDEEM_POINTS } from "~/shared/lib/money";

export const REDEEM_PRESETS = [100, 500, 1000, 5000] as const;

export const pointsToNextPeso = (points: number) =>
	points >= MIN_REDEEM_POINTS ? 0 : MIN_REDEEM_POINTS - points;

export const redeemablePoints = (points: number) =>
	Math.floor(points / MIN_REDEEM_POINTS) * MIN_REDEEM_POINTS;
