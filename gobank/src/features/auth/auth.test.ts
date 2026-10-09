import assert from "node:assert/strict";
import { test } from "node:test";
import {
	lockExpiry,
	lockMinutesLeft,
	PIN_LOCK_MINUTES,
	validatePin,
	validateUsername,
} from "./auth.rules";
import { pin, pinChange, pinDigits } from "./auth.schemas";
import { hashPin, verifyPin } from "./pin";

void test("username validation normalizes case and rejects reserved or invalid names", () => {
	assert.equal(validateUsername(" Student_1 ").state, "available");
	assert.equal(validateUsername(" ADMIN ").state, "taken");
	for (const value of [
		"ab",
		"a".repeat(21),
		"student-name",
		"student@example.com",
	]) {
		assert.equal(validateUsername(value).state, "invalid");
	}
	assert.equal(validateUsername("").state, "idle");
});

void test("a new PIN requires six digits and rejects predictable patterns", () => {
	for (const value of [
		"",
		"12345",
		"1234567",
		"12x456",
		"111111",
		"012345",
		"123456",
		"456789",
		"987654",
		"654321",
		"543210",
	]) {
		assert.notEqual(validatePin(value), null);
		assert.equal(pin.safeParse(value).success, false);
	}
	assert.equal(validatePin("024680"), null);
	assert.equal(pin.safeParse("024680").success, true);
	assert.equal(validatePin("789012"), null);
	assert.equal(pin.safeParse("789012").success, true);
});

void test("an existing six-digit PIN can be verified without applying new-PIN strength rules", () => {
	assert.equal(pinDigits.safeParse("123456").success, true);
	assert.equal(
		pinChange.safeParse({ currentPin: "123456", newPin: "246802" }).success,
		true,
	);
	assert.equal(
		pinChange.safeParse({ currentPin: "246802", newPin: "246802" }).success,
		false,
	);
	assert.equal(
		pinChange.safeParse({ currentPin: "not-a-pin", newPin: "246802" }).success,
		false,
	);
});

void test("PIN lock lasts fifteen minutes and expires without extending itself", () => {
	const now = new Date("2026-10-08T00:00:00Z");
	const expiry = lockExpiry(now);
	assert.equal(expiry.getTime() - now.getTime(), PIN_LOCK_MINUTES * 60_000);
	assert.equal(lockMinutesLeft(expiry, now), PIN_LOCK_MINUTES);
	assert.equal(lockMinutesLeft(expiry, new Date(expiry.getTime() - 1)), 1);
	assert.equal(lockMinutesLeft(expiry, expiry), 0);
	assert.equal(lockMinutesLeft(expiry, new Date(expiry.getTime() + 1)), 0);
	assert.equal(lockMinutesLeft(null, now), 0);
});

void test("PIN hashes use separate salts and match only the supplied secret", async () => {
	const first = await hashPin("246802");
	const second = await hashPin("246802");
	assert.notEqual(first, second);
	assert.equal(await verifyPin("246802", first), true);
	assert.equal(await verifyPin("246803", first), false);
	const cvv = await hashPin("012");
	assert.equal(await verifyPin("012", cvv), true);
});

void test("malformed stored hashes fail closed, including extra or truncated hex", async () => {
	const stored = await hashPin("246802");
	for (const value of [
		"",
		"invalid",
		stored.slice(0, -1),
		stored + "zz",
		stored + ":extra",
	]) {
		assert.equal(await verifyPin("246802", value), false);
	}
});
