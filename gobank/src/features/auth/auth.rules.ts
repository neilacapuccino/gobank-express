import type { CardBrandId } from "~/features/card/card-brands";

export const PIN_LENGTH = 6;
export const USERNAME_MIN = 3;
const USERNAME_MAX = 20;

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
  | { state: "available" };

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
  if (pin.length !== PIN_LENGTH) return null;

  if (/^(\d)\1+$/.test(pin)) {
    return "Avoid repeating the same digit";
  }

  const digits = pin.split("").map(Number);
  const ascending = digits.every(
    (digit, index) => index === 0 || digit === (digits[index - 1] ?? 0) + 1,
  );
  const descending = digits.every(
    (digit, index) => index === 0 || digit === (digits[index - 1] ?? 0) - 1,
  );
  if (ascending || descending) {
    return "Avoid sequences like 123456";
  }

  return null;
}

export type RegistrationDraft = {
  username: string;
  pin: string;
  brand: CardBrandId;
  fullName: string;
  mobile: string;
  email: string;
  googleLinked: boolean;
};

export const EMPTY_DRAFT: RegistrationDraft = {
  username: "",
  pin: "",
  brand: "gobank",
  fullName: "",
  mobile: "",
  email: "",
  googleLinked: false,
};

export function cardholderName(draft: RegistrationDraft) {
  const name = draft.fullName.trim();
  if (name.length > 0) return name.toUpperCase();
  return draft.username.toUpperCase();
}
