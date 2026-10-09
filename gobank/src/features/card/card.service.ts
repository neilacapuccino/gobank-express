import type { CardKind, Prisma } from "../../../generated/prisma";
import { env } from "~/env";
import { decryptCvv, newCvvCredentials } from "./card-cvv.server";
import { newCardCredentials } from "./card-credentials.server";
import { virtualCardBrand } from "./card-generation.server";
import { db } from "~/server/db";
import { fail } from "~/server/errors";
import { isSupportedCardBrand, type CardBrandId } from "./card-brands";

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

const publicCard = ({ cvvEncrypted, ...card }: CardRow) => {
	if (!isSupportedCardBrand(card.brand))
		return fail(
			"BAD_REQUEST",
			"Reload your card details to update the network.",
		);
	return { ...card, brand: card.brand, hasCvv: cvvEncrypted !== null };
};

const readyCard = (card: CardRow) =>
	isSupportedCardBrand(card.brand) && card.cvvEncrypted !== null;

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

async function repairCard(
	tx: Tx,
	userId: string,
	{
		card,
		kind,
		brand,
		excludedCvv,
	}: {
		card: CardRow | undefined;
		kind: CardKind;
		brand: CardBrandId;
		excludedCvv?: string;
	},
) {
	if (!card || !isSupportedCardBrand(card.brand)) {
		const replacement = await newCardCredentials(brand, excludedCvv);
		const issued = await tx.card.upsert({
			where: { userId_kind: { userId, kind } },
			create: { ...replacement.card, userId, kind },
			update: replacement.card,
			select: CARD_FIELDS,
		});
		return { card: issued, cvv: replacement.cvv };
	}
	if (card.cvvEncrypted !== null) return { card, cvv: storedCvv(card) };
	const security = await newCvvCredentials(
		card.number,
		env.CARD_ENCRYPTION_KEY,
		excludedCvv,
	);
	const issued = await tx.card.update({
		where: { userId_kind: { userId, kind } },
		data: { cvvHash: security.cvvHash, cvvEncrypted: security.cvvEncrypted },
		select: CARD_FIELDS,
	});
	return { card: issued, cvv: security.cvv };
}

async function accountCards(tx: Tx, userId: string) {
	const cards = await tx.card.findMany({
		where: { userId },
		select: CARD_FIELDS,
	});
	const physical = cards.find((card) => card.kind === "physical");
	const virtual = cards.find((card) => card.kind === "virtual");
	if (!physical) return fail("NOT_FOUND", "Your physical card was not found.");
	if (virtual && cards.every(readyCard)) return publicCards(cards);

	// Verify the configured key before replacing any existing credentials.
	if (physical.cvvEncrypted !== null) storedCvv(physical);
	const existingVirtualCvv =
		virtual && virtual.cvvEncrypted !== null ? storedCvv(virtual) : undefined;
	const physicalBrand = isSupportedCardBrand(physical.brand)
		? physical.brand
		: virtual?.brand === "discover"
			? "mastercard"
			: "discover";
	const repairedPhysical = await repairCard(tx, userId, {
		card: physical,
		kind: "physical",
		brand: physicalBrand,
		excludedCvv: existingVirtualCvv,
	});
	const repairedVirtual = await repairCard(tx, userId, {
		card: virtual,
		kind: "virtual",
		brand: virtualCardBrand(physicalBrand),
		excludedCvv: repairedPhysical.cvv,
	});
	return publicCards([repairedPhysical.card, repairedVirtual.card]);
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
	if (cards.length === 2 && cards.every(readyCard))
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
