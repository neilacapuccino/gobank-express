import type { CardBrandId } from "~/features/card/card-brands";

export const PIN_LENGTH = 6;
export const MAX_PIN_ATTEMPTS = 5;
export const PIN_LOCK_MINUTES = 15;
export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;

const RESERVED_USERNAMES = [
	"admin",
	"administrator",
	"support",
	"help",
	"gobank",
	"gobankexpress",
	"root",
	"system",
	"security",
	"billing",
];

export type UsernameCheck =
	| { state: "idle" }
	| { state: "checking" }
	| { state: "invalid"; message: string }
	| { state: "taken"; message: string }
	| { state: "error"; message: string }
	| { state: "available" };

export const cleanUsernameInput = (raw: string) =>
	raw.toLowerCase().replace(/[^a-z0-9_]/g, "");

export function validateUsername(raw: string): UsernameCheck {
	const value = raw.trim().toLowerCase();

	if (value.length === 0) return { state: "idle" };
	if (value.length < USERNAME_MIN) {
		return {
			state: "invalid",
			message: `At least ${USERNAME_MIN} characters`,
		};
	}
	if (value.length > USERNAME_MAX) {
		return {
			state: "invalid",
			message: `At most ${USERNAME_MAX} characters`,
		};
	}
	if (!/^[a-z0-9_]+$/.test(value)) {
		return {
			state: "invalid",
			message: "Letters, numbers and underscore only",
		};
	}
	if (RESERVED_USERNAMES.includes(value)) {
		return { state: "taken", message: "This name is reserved" };
	}
	return { state: "available" };
}

export function validatePin(pin: string): string | null {
	if (!/^\d{6}$/.test(pin)) return `Use ${PIN_LENGTH} digits`;

	const sameDigitRepeated = /^(\d)\1+$/.test(pin);
	if (sameDigitRepeated) return "Avoid repeating the same digit";

	const isSequence = "0123456789".includes(pin) || "9876543210".includes(pin);
	if (isSequence) return "Avoid sequences like 123456";

	return null;
}

export const lockExpiry = (now: Date) =>
	new Date(now.getTime() + PIN_LOCK_MINUTES * 60_000);

export function lockMinutesLeft(lockedUntil: Date | null, now: Date) {
	if (!lockedUntil) return 0;

	const millisecondsLeft = lockedUntil.getTime() - now.getTime();
	return Math.max(0, Math.ceil(millisecondsLeft / 60_000));
}

export type RegistrationDraft = {
	username: string;
	pin: string;
	brand: CardBrandId;
	fullName: string;
	mobile: string;
};

export const EMPTY_DRAFT: RegistrationDraft = {
	username: "",
	pin: "",
	brand: "discover",
	fullName: "",
	mobile: "",
};
