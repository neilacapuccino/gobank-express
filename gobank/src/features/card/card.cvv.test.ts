import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import test from "node:test";
import { decryptCvv, encryptCvv } from "./card-cvv.server";
import { AppError } from "~/server/errors";
import { newCardNumber, virtualCardBrand } from "./card-generation.server";
import { cardBrand } from "~/features/auth/auth.schemas";
import { CARD_BRANDS } from "./card-brands";

const cardNumber = "4242000000000000";
const newKey = () => randomBytes(32).toString("hex");
const unavailable = (error: unknown) =>
	error instanceof AppError &&
	error.code === "BAD_REQUEST" &&
	error.message === "Your card security details are temporarily unavailable.";

void test("Only the four supported networks can be issued", () => {
	assert.deepEqual(
		CARD_BRANDS.map((brand) => brand.id),
		["visa", "mastercard", "jcb", "discover"],
	);
	for (const brand of CARD_BRANDS) {
		assert.equal(cardBrand.parse(brand.id), brand.id);
		assert.notEqual(virtualCardBrand(brand.id), brand.id);
	}
	for (const invalid of ["gobank", "amex", "", null, undefined, 1])
		assert.equal(cardBrand.safeParse(invalid).success, false);
});

void test("Issued PANs have the network prefix and a valid Luhn checksum", () => {
	const numbers = new Set<string>();
	for (const brand of CARD_BRANDS) {
		for (let sample = 0; sample < 10; sample++) {
			const number = newCardNumber(brand.id);
			assert.match(number, /^\d{16}$/);
			assert.equal(number.slice(0, 4), brand.numberPrefix);
			assert.equal(numbers.has(number), false);
			numbers.add(number);
			let sum = 0;
			let double = false;
			for (let index = number.length - 1; index >= 0; index--) {
				let digit = Number(number[index]);
				if (double) digit *= 2;
				if (digit > 9) digit -= 9;
				sum += digit;
				double = !double;
			}
			assert.equal(sum % 10, 0);
		}
	}
});

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
