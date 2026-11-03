import "server-only";
import { randomInt } from "node:crypto";
import { getBrand, type CardBrandId } from "./card-brands";

const CARD_LENGTH = 16;
const CARD_VALID_YEARS = 5;

const randomDigits = (length: number) =>
	Array.from({ length }, () => randomInt(10)).join("");

function luhnCheckDigit(digitsWithoutCheck: string) {
	const sum = [...digitsWithoutCheck].reduce((total, digit, index) => {
		const doubled = Number(digit) * (index % 2 === 0 ? 2 : 1);
		return total + (doubled > 9 ? doubled - 9 : doubled);
	}, 0);

	return (10 - (sum % 10)) % 10;
}

export function newCardNumber(brand: CardBrandId) {
	const prefix = getBrand(brand).numberPrefix;
	const body = prefix + randomDigits(CARD_LENGTH - 1 - prefix.length);

	return `${body}${luhnCheckDigit(body)}`;
}

export const virtualCardBrand = (physical: CardBrandId): CardBrandId =>
	physical === "visa" ? "mastercard" : "visa";

export const cardExpiry = (from = new Date()) =>
	new Date(
		Date.UTC(
			from.getUTCFullYear() + CARD_VALID_YEARS,
			from.getUTCMonth() + 1,
			0,
		),
	);
