import { newAccountNumber } from "~/server/codes";
import { db } from "~/server/db";
import { fail, MESSAGES } from "~/server/errors";
import { endOtherSessions, startSession } from "~/server/session";
import type { CardBrand } from "../../../generated/prisma";
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

type PinOwner = { id: string; pinHash: string; lockedUntil: Date | null };

type Registration = {
	username: string;
	pin: string;
	brand: CardBrand;
	fullName: string;
	mobile: string | null;
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
	return db.$transaction(async (tx) => {
		const card = await consumeRegistrationCard(tx, token, brand);
		return tx.user.create({
			data: {
				...profile,
				pinHash,
				accountNumber: newAccountNumber(),
				card: {
					create: {
						...card,
					},
				},
			},
			select: { id: true },
		});
	});
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

async function checkPin(user: PinOwner, pin: string, wrongMessage: string) {
	const now = new Date();
	const minutesLeft = lockMinutesLeft(user.lockedUntil, now);
	if (minutesLeft > 0) {
		fail("TOO_MANY_REQUESTS", MESSAGES.pinLocked(minutesLeft));
	}

	const correct = await verifyPin(pin, user.pinHash);
	const { failedPinAttempts } = await db.user.update({
		where: { id: user.id },
		data: correct
			? { failedPinAttempts: 0, lockedUntil: null }
			: { failedPinAttempts: { increment: 1 } },
		select: { failedPinAttempts: true },
	});
	if (correct) return;
	if (failedPinAttempts < MAX_PIN_ATTEMPTS) fail("UNAUTHORIZED", wrongMessage);

	await db.user.update({
		where: { id: user.id },
		data: { failedPinAttempts: 0, lockedUntil: lockExpiry(now) },
	});
	fail("TOO_MANY_REQUESTS", MESSAGES.pinLocked(PIN_LOCK_MINUTES));
}

export async function signIn(username: string, pin: string) {
	const user = await db.user.findUnique({ where: { username } });
	if (!user) return fail("UNAUTHORIZED", MESSAGES.wrongCredentials);
	await checkPin(user, pin, MESSAGES.wrongCredentials);
	await startSession(user.id);
}

export async function changePin(
	userId: string,
	currentPin: string,
	newPin: string,
) {
	const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
	await checkPin(user, currentPin, MESSAGES.wrongPin);
	await db.user.update({
		where: { id: userId },
		data: { pinHash: await hashPin(newPin) },
	});
	await endOtherSessions(userId);
}
