import type { CardKind, Prisma } from "../../../generated/prisma";
import { env } from "~/env";
import { decryptCvv, newCvvCredentials } from "~/server/card-cvv";
import { newCardCredentials } from "~/server/card-credentials";
import { virtualCardBrand } from "~/server/codes";
import { db } from "~/server/db";
import { fail } from "~/server/errors";

type CardSettings = {
	cardLocked?: boolean;
	cardDailyLimit?: number;
};

type CardPolicy = { cardLocked: boolean; cardDailyLimit: number };
type Tx = Prisma.TransactionClient;

const CARD_FIELDS = {
	kind: true,
	brand: true,
	number: true,
	expiresAt: true,
	cvvEncrypted: true,
	user: { select: { fullName: true } },
} as const;

type CardRow = Prisma.CardGetPayload<{ select: typeof CARD_FIELDS }>;

const publicCard = ({ cvvEncrypted, ...card }: CardRow) => ({
	...card,
	hasCvv: cvvEncrypted !== null,
});

const publicCards = (cards: CardRow[]) => {
	const physical = cards.find((card) => card.kind === "physical");
	const virtual = cards.find((card) => card.kind === "virtual");
	if (!physical || !virtual)
		return fail("NOT_FOUND", "Your card details were not found.");
	return { physical: publicCard(physical), virtual: publicCard(virtual) };
};

const storedCvv = (card: { number: string; cvvEncrypted: string | null }) => {
	if (card.cvvEncrypted === null)
		fail("BAD_REQUEST", "Reload your card details to view the security code.");
	return decryptCvv(card.cvvEncrypted, card.number, env.CARD_ENCRYPTION_KEY);
};

async function lockCardAccount(tx: Tx, userId: string) {
	const [account] = await tx.$queryRaw<CardPolicy[]>`
		SELECT "cardLocked", "cardDailyLimit" FROM "User"
		WHERE "id" = ${userId} FOR UPDATE
	`;
	if (!account) return fail("NOT_FOUND", "This account no longer exists.");
	return account;
}

async function accountCards(tx: Tx, userId: string) {
	let cards = await tx.card.findMany({
		where: { userId },
		select: CARD_FIELDS,
	});
	const physical = cards.find((card) => card.kind === "physical");
	const virtual = cards.find((card) => card.kind === "virtual");
	if (!physical) return fail("NOT_FOUND", "Your physical card was not found.");
	if (physical.cvvEncrypted === null || virtual?.cvvEncrypted == null) {
		// Validate existing credentials before changing a legacy account.
		const existingVirtualCvv =
			virtual && virtual.cvvEncrypted !== null ? storedCvv(virtual) : undefined;
		const physicalSecurity =
			physical.cvvEncrypted === null
				? await newCvvCredentials(
						physical.number,
						env.CARD_ENCRYPTION_KEY,
						existingVirtualCvv,
					)
				: null;
		const physicalCvv = physicalSecurity?.cvv ?? storedCvv(physical);
		const virtualSecurity =
			virtual?.cvvEncrypted === null
				? await newCvvCredentials(
						virtual.number,
						env.CARD_ENCRYPTION_KEY,
						physicalCvv,
					)
				: null;
		const newVirtual = !virtual
			? (
					await newCardCredentials(
						virtualCardBrand(physical.brand),
						physicalCvv,
					)
				).card
			: null;

		if (physicalSecurity)
			await tx.card.updateMany({
				where: { userId, kind: "physical", cvvEncrypted: null },
				data: {
					cvvHash: physicalSecurity.cvvHash,
					cvvEncrypted: physicalSecurity.cvvEncrypted,
				},
			});
		if (virtualSecurity)
			await tx.card.updateMany({
				where: { userId, kind: "virtual", cvvEncrypted: null },
				data: {
					cvvHash: virtualSecurity.cvvHash,
					cvvEncrypted: virtualSecurity.cvvEncrypted,
				},
			});
		if (newVirtual)
			await tx.card.upsert({
				where: { userId_kind: { userId, kind: "virtual" } },
				create: { ...newVirtual, userId, kind: "virtual" },
				update: {},
			});
		cards = await tx.card.findMany({ where: { userId }, select: CARD_FIELDS });
	}
	return publicCards(cards);
}

const TRANSACTION_OPTIONS = { maxWait: 30_000, timeout: 30_000 };

export async function getCard(userId: string) {
	const { cards, ...account } = await db.user.findUniqueOrThrow({
		where: { id: userId },
		select: {
			cardLocked: true,
			cardDailyLimit: true,
			cards: { select: CARD_FIELDS },
		},
	});
	if (cards.length === 2 && cards.every((card) => card.cvvEncrypted !== null))
		return { ...publicCards(cards), ...account };
	return db.$transaction(async (tx) => {
		const account = await lockCardAccount(tx, userId);
		return { ...(await accountCards(tx, userId)), ...account };
	}, TRANSACTION_OPTIONS);
}

export const updateCard = (userId: string, settings: CardSettings) =>
	db.$transaction(async (tx) => {
		await lockCardAccount(tx, userId);
		const account = await tx.user.update({
			where: { id: userId },
			data: settings,
			select: { cardLocked: true, cardDailyLimit: true },
		});
		return { ...(await accountCards(tx, userId)), ...account };
	}, TRANSACTION_OPTIONS);

export async function revealCvv(userId: string, kind: CardKind) {
	const card = await db.card.findUniqueOrThrow({
		where: { userId_kind: { userId, kind } },
		select: { number: true, cvvEncrypted: true },
	});
	return { cvv: storedCvv(card) };
}
