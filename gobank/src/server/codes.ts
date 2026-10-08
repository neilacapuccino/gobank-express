import { randomInt } from "node:crypto";
import type { CardBrand } from "../../generated/prisma";
import { getBrand } from "~/features/card/card-brands";

const REFERENCE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const pick = (alphabet: string, length: number) =>
	Array.from({ length }, () => alphabet[randomInt(alphabet.length)]).join("");

export const newReference = () => `GB${pick(REFERENCE_ALPHABET, 8)}`;

export const newAccountNumber = () => `20${pick("0123456789", 9)}`;

export function newCardNumber(brand: CardBrand) {
	const prefix = getBrand(brand).numberPrefix;
	return prefix + pick("0123456789", 16 - prefix.length);
}

export const virtualCardBrand = (physical: CardBrand): CardBrand =>
	physical === "visa" ? "mastercard" : "visa";

export const cardExpiry = (from = new Date()) =>
	new Date(Date.UTC(from.getUTCFullYear() + 5, from.getUTCMonth() + 1, 0));
