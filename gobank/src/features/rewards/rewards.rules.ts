import { MIN_REDEEM_POINTS } from "~/shared/lib/money";

const REDEEM_PRESETS = [100, 500, 1000, 5000];
const MAX_OPTIONS = 4;

export const pointsToNextPeso = (points: number) =>
	points >= MIN_REDEEM_POINTS ? 0 : MIN_REDEEM_POINTS - points;

export const redeemablePoints = (points: number) =>
	Math.floor(points / MIN_REDEEM_POINTS) * MIN_REDEEM_POINTS;

export function convertOptions(points: number) {
	const max = redeemablePoints(points);
	const smallerPresets = REDEEM_PRESETS.filter((preset) => preset < max);

	return [...smallerPresets, max].slice(-MAX_OPTIONS);
}
