import { newAccountNumber, virtualCardBrand } from "~/server/codes";
import { newCardCredentials } from "~/server/card-credentials";
import { decryptCvv } from "~/server/card-cvv";
import { env } from "~/env";
import { db } from "~/server/db";
import { fail, MESSAGES } from "~/server/errors";
import { endOtherSessions, startSession } from "~/server/session";
import type { CardBrandId } from "~/features/card/card-brands";
import {
	lockExpiry,
	lockMinutesLeft,
	MAX_PIN_ATTEMPTS,
	PIN_LOCK_MINUTES,
} from "./auth.rules";
import { hashPin, verifyPin } from "./pin";
import {
	clearRegistrationCard,
	consumeRegistrationCard,
	registrationCardToken,
} from "./card-preview.service";

type Registration = {
	username: string;
	pin: string;
	brand: CardBrandId;
	fullName: string;
	mobile: string | null;
};

type PinAccount = {
	pinHash: string;
	failedPinAttempts: number;
	lockedUntil: Date | null;
};

export async function isUsernameFree(username: string) {
	const taken = await db.user.findUnique({
		where: { username },
		select: { id: true },
	});
	return !taken;
}

export async function createRegisteredAccount(
	{ pin, brand, ...profile }: Registration,
	token: string,
) {
	const pinHash = await hashPin(pin);
	return db.$transaction(
		async (tx) => {
			const card = await consumeRegistrationCard(tx, token, brand);
			const physicalCvv = decryptCvv(
				card.cvvEncrypted,
				card.number,
				env.CARD_ENCRYPTION_KEY,
			);
			const virtual = (
				await newCardCredentials(virtualCardBrand(brand), physicalCvv)
			).card;
			return tx.user.create({
				data: {
					...profile,
					pinHash,
					accountNumber: newAccountNumber(),
					cards: {
						create: [
							{ ...card, kind: "physical" },
							{ ...virtual, kind: "virtual" },
						],
					},
				},
				select: { id: true },
			});
		},
		{ maxWait: 30_000, timeout: 30_000 },
	);
}

export async function register(profile: Registration) {
	const user = await createRegisteredAccount(
		profile,
		await registrationCardToken(),
	);
	await startSession(user.id);
	await clearRegistrationCard();
	return { created: true };
}

export async function verifyAccountPin(
	userId: string,
	pin: string,
	wrongMessage: string,
	pinHash?: string,
) {
	const outcome = await db.$transaction(
		async (tx) => {
			const [user] = await tx.$queryRaw<PinAccount[]>`
			SELECT "pinHash", "failedPinAttempts", "lockedUntil"
			FROM "User" WHERE "id" = ${userId} FOR UPDATE
		`;
			if (!user) return fail("NOT_FOUND", "This account no longer exists.");
			const now = new Date();
			const minutesLeft = lockMinutesLeft(user.lockedUntil, now);
			if (minutesLeft > 0) return { correct: false, minutesLeft };

			const correct = await verifyPin(pin, user.pinHash);
			const attempts = correct ? 0 : user.failedPinAttempts + 1;
			const locked = attempts >= MAX_PIN_ATTEMPTS;
			await tx.user.update({
				where: { id: userId },
				data: {
					failedPinAttempts: locked ? 0 : attempts,
					lockedUntil: locked ? lockExpiry(now) : null,
					...(correct && pinHash ? { pinHash } : {}),
				},
				select: { id: true },
			});
			return { correct, minutesLeft: locked ? PIN_LOCK_MINUTES : 0 };
		},
		{ maxWait: 30_000, timeout: 30_000 },
	);

	// Failed attempts must commit before an error is returned to the client.
	if (outcome.correct) return;
	if (outcome.minutesLeft > 0) {
		fail("TOO_MANY_REQUESTS", MESSAGES.pinLocked(outcome.minutesLeft));
	}
	fail("UNAUTHORIZED", wrongMessage);
}

export async function signIn(username: string, pin: string) {
	const user = await db.user.findUnique({
		where: { username },
		select: { id: true },
	});
	if (!user) return fail("UNAUTHORIZED", MESSAGES.wrongCredentials);
	await verifyAccountPin(user.id, pin, MESSAGES.wrongCredentials);
	await startSession(user.id);
}

export async function changePin(
	userId: string,
	currentPin: string,
	newPin: string,
) {
	await verifyAccountPin(
		userId,
		currentPin,
		MESSAGES.wrongPin,
		await hashPin(newPin),
	);
	await endOtherSessions(userId);
}
