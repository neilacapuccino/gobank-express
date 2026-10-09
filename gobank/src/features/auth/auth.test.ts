import assert from "node:assert/strict";
import { test } from "node:test";
import { lockExpiry, lockMinutesLeft, PIN_LOCK_MINUTES } from "./auth.rules";
import { pin, pinChange, username } from "./auth.schemas";
import { hashPin, verifyPin } from "./pin";

void test("registration validates usernames and new PINs while accepting an existing PIN", () => {
	assert.equal(username.parse(" Student_1 "), "student_1");
	for (const value of ["ADMIN", "student-name"])
		assert.equal(username.safeParse(value).success, false);
	assert.equal(pin.parse("246802"), "246802");
	for (const value of ["12345", "12x456", "111111", "123456"])
		assert.equal(pin.safeParse(value).success, false);
	assert.equal(
		pinChange.safeParse({ currentPin: "123456", newPin: "246802" }).success,
		true,
	);
	assert.equal(
		pinChange.safeParse({ currentPin: "246802", newPin: "246802" }).success,
		false,
	);
});

void test("PIN lock expires after fifteen minutes without extending itself", () => {
	const now = new Date("2026-01-01T00:00:00Z");
	const expiry = lockExpiry(now);
	assert.equal(expiry.getTime() - now.getTime(), PIN_LOCK_MINUTES * 60_000);
	assert.equal(lockMinutesLeft(expiry, now), 15);
	assert.equal(lockMinutesLeft(expiry, new Date(expiry.getTime() - 1)), 1);
	assert.equal(lockMinutesLeft(expiry, expiry), 0);
	assert.equal(lockMinutesLeft(null, now), 0);
});

void test("salted PIN hashes accept only the correct secret and reject malformed hashes", async () => {
	const stored = await hashPin("246802");
	assert.notEqual(stored, await hashPin("246802"));
	assert.equal(await verifyPin("246802", stored), true);
	assert.equal(await verifyPin("246803", stored), false);
	for (const value of ["invalid", stored.slice(0, -1), stored + ":extra"])
		assert.equal(await verifyPin("246802", value), false);
});
