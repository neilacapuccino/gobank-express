import {
	MAX_REWARD_POINTS,
	MIN_REDEEM_POINTS,
	pointsValue,
} from "~/shared/lib/money";

export const EARN_RULE = "1 point for every ₱50 you spend";
export const REDEEM_RULE = "100 points = ₱1.00 cash back";
export const REDEEM_PRESETS = [100, 500, 1000, 5000] as const;

export const pointsToNextPeso = (points: number) =>
	points >= MIN_REDEEM_POINTS ? 0 : MIN_REDEEM_POINTS - points;

export const redeemablePoints = (points: number) =>
	Math.floor(points / MIN_REDEEM_POINTS) * MIN_REDEEM_POINTS;

export type RedeemCheck =
	{ ok: true; points: number; cashBack: number } | { ok: false; error: string };

export function checkRedeem(input: string, available: number): RedeemCheck {
	const text = input.trim();
	if (!text) return { ok: false, error: "Enter the points to redeem." };
	if (!/^\d+$/.test(text))
		return { ok: false, error: "Use whole numbers only." };
	const points = Number(text);
	if (points < MIN_REDEEM_POINTS)
		return { ok: false, error: `Redeem at least ${MIN_REDEEM_POINTS} points.` };
	if (points % MIN_REDEEM_POINTS !== 0)
		return {
			ok: false,
			error: `Redeem in multiples of ${MIN_REDEEM_POINTS} points.`,
		};
	if (points > MAX_REWARD_POINTS)
		return { ok: false, error: "That is more than you can redeem at once." };
	if (points > available)
		return { ok: false, error: "You don't have enough points." };
	return { ok: true, points, cashBack: pointsValue(points) };
}
