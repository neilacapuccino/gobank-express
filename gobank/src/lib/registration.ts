import type { CardBrandId } from "./card-brands";

export const PIN_LENGTH = 6;
export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;

export const RESERVED_USERNAMES = [
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

const DEMO_TAKEN_USERNAMES = ["user", "test", "demo", "sample", "example"];

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
  if (DEMO_TAKEN_USERNAMES.includes(value)) {
    return { state: "taken", message: "Already taken" };
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

export function normaliseMobile(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("63")) return `0${digits.slice(2)}`;
  return digits;
}

export function validateMobile(raw: string): string | null {
  if (raw.trim().length === 0) return null;
  const value = normaliseMobile(raw);
  if (!/^09\d{9}$/.test(value)) {
    return "Use the format 09XXXXXXXXX";
  }
  return null;
}

export function validateEmail(raw: string): string | null {
  if (raw.trim().length === 0) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(raw.trim())) {
    return "That does not look like an email";
  }
  return null;
}

export function formatMobile(raw: string) {
  const value = normaliseMobile(raw);
  if (value.length !== 11) return raw;
  return `${value.slice(0, 4)} ${value.slice(4, 7)} ${value.slice(7)}`;
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
