import { MAX_STASHES } from "~/shared/lib/money";

export type ErrorCode =
  "BAD_REQUEST" | "UNAUTHORIZED" | "NOT_FOUND" | "CONFLICT";

export const MESSAGES = {
  signInRequired: "Sign in to continue",
  wrongCredentials: "Wrong username or PIN",
  insufficientBalance: "Insufficient balance",
  notEnoughPoints: "Not enough points",
  notEnoughInStash: "Not enough in this Stash",
  cardLocked: "Unlock your card to spend",
  overDailyLimit: "This goes over your daily limit",
  recipientNotFound: "No GoBank account matches that",
  ownAccount: "That is your own account",
  stashLimit: `You can have up to ${MAX_STASHES} Stashes`,
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
