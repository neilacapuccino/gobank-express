import { peso } from "~/shared/lib/format";
import { MAX_TRANSACTION_CENTAVOS } from "~/shared/lib/money";

export const STASH_NAME_MAX = 40;

export type GoalTransfer = "in" | "out";

export const isValidGoalName = (name: string) => {
	const length = name.trim().length;
	return length > 0 && length <= STASH_NAME_MAX;
};

export function goalAmountError(
	typed: string,
	centavos: number,
	available = MAX_TRANSACTION_CENTAVOS,
	direction?: GoalTransfer,
) {
	if (!typed.trim()) return null;
	if (!(centavos > 0)) return "Enter an amount above ₱0.00";

	if (centavos > MAX_TRANSACTION_CENTAVOS) {
		return `Maximum ${peso(MAX_TRANSACTION_CENTAVOS)}`;
	}

	if (centavos <= available) return null;

	return direction === "out"
		? `Only ${peso(available)} is in this goal`
		: `Insufficient balance. You have ${peso(available)}`;
}
