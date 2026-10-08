import { randomInt } from "node:crypto";
import type { Prisma } from "../../../generated/prisma";
import { hashPin } from "~/features/auth/pin";
import { env } from "~/env";
import { decryptCvv, encryptCvv } from "~/server/card-cvv";
import { db } from "~/server/db";
import { fail } from "~/server/errors";

type CardSettings = {
	locked?: boolean;
	dailyLimit?: number;
};

const CARD_FIELDS = {
	brand: true,
	number: true,
	expiresAt: true,
	locked: true,
	dailyLimit: true,
	cvvEncrypted: true,
	user: { select: { fullName: true } },
} as const;

type CardRow = Prisma.CardGetPayload<{ select: typeof CARD_FIELDS }>;

const publicCard = ({ cvvEncrypted, ...card }: CardRow) => ({
	...card,
	hasCvv: cvvEncrypted !== null,
});

export const getCard = async (userId: string) =>
	publicCard(
		await db.card.findUniqueOrThrow({
			where: { userId },
			select: CARD_FIELDS,
		}),
	);

export const updateCard = async (userId: string, settings: CardSettings) =>
	publicCard(
		await db.card.update({
			where: { userId },
			data: settings,
			select: CARD_FIELDS,
		}),
	);

export async function revealCvv(userId: string) {
	const card = await db.card.findUniqueOrThrow({
		where: { userId },
		select: { number: true, cvvEncrypted: true },
	});
	if (card.cvvEncrypted === null)
		fail("BAD_REQUEST", "Set up your card security code first.");
	return {
		cvv: decryptCvv(card.cvvEncrypted, card.number, env.CARD_ENCRYPTION_KEY),
	};
}

export async function createCvv(userId: string) {
	const card = await db.card.findUniqueOrThrow({
		where: { userId },
		select: { id: true, number: true, cvvEncrypted: true },
	});
	if (card.cvvEncrypted !== null)
		return {
			cvv: decryptCvv(card.cvvEncrypted, card.number, env.CARD_ENCRYPTION_KEY),
		};
	const cvv = randomInt(1000).toString().padStart(3, "0");
	const cvvEncrypted = encryptCvv(cvv, card.number, env.CARD_ENCRYPTION_KEY);
	const created = await db.card.updateMany({
		where: { id: card.id, userId, cvvEncrypted: null },
		data: { cvvEncrypted, cvvHash: await hashPin(cvv) },
	});
	return created.count === 1 ? { cvv } : revealCvv(userId);
}
