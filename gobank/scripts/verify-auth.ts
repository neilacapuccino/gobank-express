import "dotenv/config";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import {
	MAX_PIN_ATTEMPTS,
	PIN_LOCK_MINUTES,
} from "../src/features/auth/auth.rules";
import { verifyAccountPin } from "../src/features/auth/auth.service";
import { hashPin, verifyPin } from "../src/features/auth/pin";
import { newAccountNumber } from "../src/server/codes";
import { db } from "../src/server/db";
import { AppError } from "../src/server/errors";

const currentPin = "246802";
const wrongMessage = "Incorrect PIN";
let userId: string | undefined;

try {
	const user = await db.user.create({
		data: {
			username: `auth_${randomBytes(4).toString("hex")}`,
			fullName: "Auth verification",
			accountNumber: newAccountNumber(),
			pinHash: await hashPin(currentPin),
		},
		select: { id: true },
	});
	userId = user.id;
	const before = Date.now();
	const attempts = await Promise.allSettled(
		Array.from({ length: MAX_PIN_ATTEMPTS + 3 }, () =>
			verifyAccountPin(user.id, "000000", wrongMessage),
		),
	);
	const failures = attempts.map((result) => {
		assert.equal(result.status, "rejected");
		if (result.status !== "rejected") throw new Error("Wrong PIN was accepted");
		assert.ok(result.reason instanceof AppError, String(result.reason));
		return result.reason.code;
	});
	assert.equal(
		failures.filter((code) => code === "UNAUTHORIZED").length,
		MAX_PIN_ATTEMPTS - 1,
	);
	assert.equal(
		failures.filter((code) => code === "TOO_MANY_REQUESTS").length,
		4,
	);
	const locked = await db.user.findUniqueOrThrow({
		where: { id: user.id },
		select: { failedPinAttempts: true, lockedUntil: true },
	});
	assert.equal(locked.failedPinAttempts, 0);
	assert.ok(locked.lockedUntil);
	assert.ok(locked.lockedUntil.getTime() >= before + PIN_LOCK_MINUTES * 60_000);
	await assert.rejects(
		verifyAccountPin(user.id, currentPin, wrongMessage),
		(error) => error instanceof AppError && error.code === "TOO_MANY_REQUESTS",
	);

	await db.user.update({
		where: { id: user.id },
		data: { lockedUntil: new Date(Date.now() - 1), failedPinAttempts: 4 },
		select: { id: true },
	});
	await verifyAccountPin(user.id, currentPin, wrongMessage);
	const unlocked = await db.user.findUniqueOrThrow({
		where: { id: user.id },
		select: { lockedUntil: true, failedPinAttempts: true },
	});
	assert.equal(unlocked.lockedUntil, null);
	assert.equal(unlocked.failedPinAttempts, 0);

	const replacementPins = ["024680", "135791"];
	const replacements = await Promise.all(replacementPins.map(hashPin));
	const changes = await Promise.allSettled(
		replacements.map((pinHash) =>
			verifyAccountPin(user.id, currentPin, wrongMessage, pinHash),
		),
	);
	assert.equal(
		changes.filter((result) => result.status === "fulfilled").length,
		1,
	);
	const changed = await db.user.findUniqueOrThrow({
		where: { id: user.id },
		select: { pinHash: true },
	});
	assert.equal(await verifyPin(currentPin, changed.pinHash), false);
	const matches = await Promise.all(
		replacementPins.map((pin) => verifyPin(pin, changed.pinHash)),
	);
	assert.equal(matches.filter(Boolean).length, 1);
	console.log(
		"Auth verification passed: atomic attempts, lock expiry and concurrent PIN changes.",
	);
} finally {
	try {
		if (userId) await db.user.delete({ where: { id: userId } });
	} finally {
		await db.$disconnect();
	}
}
