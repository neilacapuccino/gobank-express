import { randomInt } from "node:crypto";
import type { CardBrand } from "../../generated/prisma";

const REFERENCE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const CARD_PREFIX: Record<CardBrand, string> = {
  visa: "4",
  mastercard: "5",
  jcb: "35",
  gobank: "8",
};

const pick = (alphabet: string, length: number) =>
  Array.from({ length }, () => alphabet[randomInt(alphabet.length)]).join("");

export const newReference = () => `GB${pick(REFERENCE_ALPHABET, 8)}`;

export const newAccountNumber = () => `20${pick("0123456789", 9)}`;

export const newCardNumber = (brand: CardBrand) =>
  CARD_PREFIX[brand] + pick("0123456789", 16 - CARD_PREFIX[brand].length);

export const cardExpiry = (from = new Date()) =>
  new Date(Date.UTC(from.getUTCFullYear() + 5, from.getUTCMonth() + 1, 0));
