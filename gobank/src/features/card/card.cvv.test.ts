import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import test from "node:test";
import { decryptCvv, encryptCvv } from "~/server/card-cvv";
import { AppError } from "~/server/errors";

const cardNumber = "4242000000000000";
const newKey = () => randomBytes(32).toString("hex");
const unavailable = (error: unknown) =>
	error instanceof AppError &&
	error.code === "BAD_REQUEST" &&
	error.message === "Your card security details are temporarily unavailable.";

void test("CVV encryption preserves leading zeroes and uses a fresh nonce", () => {
	const key = newKey();
	for (const cvv of ["000", "007", "123", "999"]) {
		const first = encryptCvv(cvv, cardNumber, key);
		const second = encryptCvv(cvv, cardNumber, key);
		assert.equal(decryptCvv(first, cardNumber, key), cvv);
		assert.equal(decryptCvv(second, cardNumber, key), cvv);
		assert.notEqual(first, second);
	}
});

void test("CVV decryption rejects another card, another key, and modified payloads", () => {
	const key = newKey();
	const encrypted = encryptCvv("007", cardNumber, key);
	assert.throws(
		() => decryptCvv(encrypted, "5555000000000000", key),
		unavailable,
	);
	assert.throws(() => decryptCvv(encrypted, cardNumber, newKey()), unavailable);
	for (const component of [1, 2, 3]) {
		const parts = encrypted.split(".");
		const value = parts[component]!;
		parts[component] = `${value.startsWith("0") ? "1" : "0"}${value.slice(1)}`;
		assert.throws(
			() => decryptCvv(parts.join("."), cardNumber, key),
			unavailable,
		);
	}
});

void test("Missing keys and malformed CVV data fail with a safe public error", () => {
	const key = newKey();
	for (const invalid of [undefined, "", "short", "g".repeat(64)]) {
		assert.throws(() => encryptCvv("123", cardNumber, invalid), unavailable);
		assert.throws(
			() => decryptCvv("invalid", cardNumber, invalid),
			unavailable,
		);
	}
	for (const cvv of ["", "12", "1234", "abc", " 123"]) {
		assert.throws(() => encryptCvv(cvv, cardNumber, key), unavailable);
	}
	for (const encrypted of ["", "invalid", "v2.00.00.00"]) {
		assert.throws(() => decryptCvv(encrypted, cardNumber, key), unavailable);
	}
});
