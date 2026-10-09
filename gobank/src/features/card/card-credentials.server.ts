import "server-only";
import { isSupportedCardBrand, type CardBrandId } from "./card-brands";
import { env } from "~/env";
import { newCvvCredentials } from "./card-cvv.server";
import { cardExpiry, newCardNumber } from "./card-generation.server";
import { fail } from "~/server/errors";

export async function newCardCredentials(
	brand: CardBrandId,
	excludedCvv?: string,
) {
	if (!isSupportedCardBrand(brand))
		fail("BAD_REQUEST", "Choose a supported card network.");
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
