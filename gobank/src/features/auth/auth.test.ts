import assert from "node:assert/strict";
import { test } from "node:test";
import { lockExpiry, lockMinutesLeft, PIN_LOCK_MINUTES } from "./auth.rules";
import { pin, pinChange, username } from "./auth.schemas";
import { hashPin, verifyPin } from "./pin";

void test("usernames are trimmed, lower-cased and must not be reserved", () => {
	assert.equal(username.parse(" Student_1 "), "student_1");

	for (const value of ["ADMIN", "student-name"]) {
		assert.equal(username.safeParse(value).success, false, value);
	}
});

void test("a new PIN must be six digits and not too easy to guess", () => {
	assert.equal(pin.parse("246802"), "246802");

	for (const value of ["12345", "12x456", "111111", "123456"]) {
		assert.equal(pin.safeParse(value).success, false, value);
	}
});

void test("changing a PIN requires a different new PIN", () => {
	const different = { currentPin: "123456", newPin: "246802" };
	const same = { currentPin: "246802", newPin: "246802" };

	assert.equal(pinChange.safeParse(different).success, true);
	assert.equal(pinChange.safeParse(same).success, false);
});

void test("a PIN lock lasts fifteen minutes and counts down", () => {
	const now = new Date("2026-01-01T00:00:00Z");
	const expiry = lockExpiry(now);
	const oneMillisecondBefore = new Date(expiry.getTime() - 1);

	assert.equal(expiry.getTime() - now.getTime(), PIN_LOCK_MINUTES * 60_000);
	assert.equal(lockMinutesLeft(expiry, now), 15);
	assert.equal(lockMinutesLeft(expiry, oneMillisecondBefore), 1);
	assert.equal(lockMinutesLeft(expiry, expiry), 0);
	assert.equal(lockMinutesLeft(null, now), 0);
});

void test("hashing the same PIN twice gives different hashes", async () => {
	const first = await hashPin("246802");
	const second = await hashPin("246802");

	assert.notEqual(first, second);
});

void test("a PIN hash accepts only the correct PIN", async () => {
	const stored = await hashPin("246802");

	assert.equal(await verifyPin("246802", stored), true);
	assert.equal(await verifyPin("246803", stored), false);
});

void test("a broken PIN hash never matches", async () => {
	const stored = await hashPin("246802");
	const brokenHashes = ["invalid", stored.slice(0, -1), `${stored}:extra`];

	for (const value of brokenHashes) {
		assert.equal(await verifyPin("246802", value), false);
	}
});
