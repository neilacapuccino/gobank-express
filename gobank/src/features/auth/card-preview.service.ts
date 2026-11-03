import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import type { Prisma } from "../../../generated/prisma";
import type { CardBrandId } from "~/features/card/card-brands";
import { newCardCredentials } from "~/features/card/card-credentials.server";
import { db } from "~/server/db";
import { fail } from "~/server/errors";

const COOKIE = "gb_registration_card";
const MAX_AGE_SECONDS = 30 * 60;

export const cardDraftId = (token: string) =>
	createHash("sha256").update(token).digest("hex");

export async function createCardPreview(brand: CardBrandId) {
	const token = randomBytes(32).toString("base64url");
	const { card, cvv } = newCardCredentials(brand);
	const validUntil = new Date(Date.now() + MAX_AGE_SECONDS * 1000);

	await db.registrationCard.deleteMany({
		where: { validUntil: { lte: new Date() } },
	});
	await db.registrationCard.create({
		data: { id: cardDraftId(token), ...card, validUntil },
	});

	return {
		token,
		preview: {
			brand,
			number: card.number,
			cvv,
			expiresAt: card.expiresAt.toISOString(),
			validUntil: validUntil.toISOString(),
		},
	};
}

export async function prepareRegistrationCard(brand: CardBrandId) {
	const store = await cookies();
	const previousToken = store.get(COOKIE)?.value;

	const prepared = await createCardPreview(brand);

	if (previousToken) {
		await db.registrationCard.deleteMany({
			where: { id: cardDraftId(previousToken) },
		});
	}

	store.set(COOKIE, prepared.token, {
		httpOnly: true,
		sameSite: "strict",
		secure: process.env.NODE_ENV === "production",
		path: "/",
		maxAge: MAX_AGE_SECONDS,
	});

	return prepared.preview;
}

export async function registrationCardToken() {
	return (await cookies()).get(COOKIE)?.value ?? "";
}

export async function clearRegistrationCard() {
	(await cookies()).delete(COOKIE);
}

export async function consumeRegistrationCard(
	tx: Prisma.TransactionClient,
	token: string,
	brand: CardBrandId,
) {
	const id = cardDraftId(token);
	const card = await tx.registrationCard.findUnique({ where: { id } });

	const usable = card?.brand === brand && card.validUntil > new Date();
	if (!card || !usable) {
		return fail("BAD_REQUEST", "Refresh your card details before confirming.");
	}

	const consumed = await tx.registrationCard.deleteMany({
		where: { id, brand, validUntil: { gt: new Date() } },
	});
	if (consumed.count !== 1) {
		return fail("CONFLICT", "This card preview has already been used.");
	}

	return {
		brand: card.brand,
		number: card.number,
		cvvEncrypted: card.cvvEncrypted,
		expiresAt: card.expiresAt,
	};
}
