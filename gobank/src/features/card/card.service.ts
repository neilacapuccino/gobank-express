import { db } from "~/server/db";

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
	user: { select: { fullName: true } },
} as const;

export const getCard = (userId: string) =>
	db.card.findUniqueOrThrow({
		where: { userId },
		select: CARD_FIELDS,
	});

export const updateCard = (userId: string, settings: CardSettings) =>
	db.card.update({
		where: { userId },
		data: settings,
		select: CARD_FIELDS,
	});
