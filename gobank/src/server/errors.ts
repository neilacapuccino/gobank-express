import { MAX_GOALS } from "~/shared/lib/money";

type ErrorCode =
	| "BAD_REQUEST"
	| "UNAUTHORIZED"
	| "NOT_FOUND"
	| "CONFLICT"
	| "TOO_MANY_REQUESTS";

export const MESSAGES = {
	signInRequired: "Sign in to continue",
	wrongCredentials: "Wrong username or PIN",
	wrongPin: "That PIN is not right",
	pinLocked: (minutes: number) =>
		`Too many wrong PINs. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
	insufficientBalance: "Insufficient balance",
	notEnoughPoints: "Not enough points",
	accountLimit: "This transaction would exceed the account limit",
	notEnoughInGoal: "Not enough in this goal",
	cardLocked: "This card is locked. Unlock it or pay with your other card.",
	cardNotFound: "Your card details were not found.",
	accountNotFound: "This account no longer exists.",
	savingsChanged: "Your savings changed. Please try again.",
	overDailyLimit: "This goes over your daily limit",
	recipientNotFound: "No GoBank account matches that",
	ownAccount: "That is your own account",
	goalLimit: `You can have up to ${MAX_GOALS} goals`,
	requestClosed: "This request is no longer open",
	notFound: "Not found",
	unexpected: "Something went wrong. Please try again.",
} as const;

export class AppError extends Error {
	constructor(
		readonly code: ErrorCode,
		message: string,
	) {
		super(message);
	}
}

export function fail(code: ErrorCode, message: string): never {
	throw new AppError(code, message);
}

type DatabaseError = { code: string; meta?: { target?: unknown } };

export const asDatabaseError = (error: unknown) =>
	typeof error === "object" &&
	error !== null &&
	"code" in error &&
	typeof error.code === "string" &&
	/^P\d{4}$/.test(error.code)
		? (error as DatabaseError)
		: null;
