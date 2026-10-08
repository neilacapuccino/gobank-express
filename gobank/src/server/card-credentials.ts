import "server-only";
import type { CardBrand } from "../../generated/prisma";
import { env } from "~/env";
import { newCvvCredentials } from "./card-cvv";
import { cardExpiry, newCardNumber } from "./codes";

export async function newCardCredentials(
	brand: CardBrand,
	excludedCvv?: string,
) {
	const number = newCardNumber(brand);
	const { cvv, cvvHash, cvvEncrypted } = await newCvvCredentials(
		number,
		env.CARD_ENCRYPTION_KEY,
		excludedCvv,
	);
	return {
		card: { brand, number, cvvHash, cvvEncrypted, expiresAt: cardExpiry() },
		cvv,
	};
}
