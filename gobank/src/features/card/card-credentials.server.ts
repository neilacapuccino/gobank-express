import "server-only";
import { env } from "~/env";
import type { CardBrandId } from "./card-brands";
import { newCvvCredentials } from "./card-cvv.server";
import { cardExpiry, newCardNumber } from "./card-generation.server";

export function newCardCredentials(brand: CardBrandId, excludedCvv?: string) {
	const number = newCardNumber(brand);
	const { cvv, cvvEncrypted } = newCvvCredentials(
		number,
		env.CARD_ENCRYPTION_KEY,
		excludedCvv,
	);

	return {
		card: { brand, number, cvvEncrypted, expiresAt: cardExpiry() },
		cvv,
	};
}
