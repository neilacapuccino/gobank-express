import "server-only";
import { randomInt } from "node:crypto";
import { getBrand, type CardBrandId } from "./card-brands";

const pick = (alphabet: string, length: number) =>
	Array.from({ length }, () => alphabet[randomInt(alphabet.length)]).join("");

export function newCardNumber(brand: CardBrandId) {
	const prefix = getBrand(brand).numberPrefix;
	const body = prefix + pick("0123456789", 15 - prefix.length);
	const sum = [...body].reduce((total, digit, index) => {
		const weighted = Number(digit) * (index % 2 === 0 ? 2 : 1);
		return total + (weighted > 9 ? weighted - 9 : weighted);
	}, 0);
	return `${body}${(10 - (sum % 10)) % 10}`;
}

export const virtualCardBrand = (physical: CardBrandId): CardBrandId =>
	physical === "visa" ? "mastercard" : "visa";

export const cardExpiry = (from = new Date()) =>
	new Date(Date.UTC(from.getUTCFullYear() + 5, from.getUTCMonth() + 1, 0));
