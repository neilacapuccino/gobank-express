import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import test from "node:test";
import { cardBrand } from "~/features/auth/auth.schemas";
import { AppError } from "~/server/errors";
import { CARD_BRANDS } from "./card-brands";
import { decryptCvv, encryptCvv } from "./card-cvv.server";
import { newCardNumber, virtualCardBrand } from "./card-generation.server";

const cardNumber = "4242000000000000";
const newKey = () => randomBytes(32).toString("hex");
const unavailable = (error: unknown) =>
	error instanceof AppError &&
	error.code === "BAD_REQUEST" &&
	error.message === "Your card security details are temporarily unavailable.";

void test("four networks issue valid numbers and a different virtual network", () => {
	assert.deepEqual(
		CARD_BRANDS.map((brand) => brand.id),
		["visa", "mastercard", "jcb", "discover"],
	);
	assert.equal(cardBrand.safeParse("gobank").success, false);
	for (const brand of CARD_BRANDS) {
		const number = newCardNumber(brand.id);
		assert.match(number, /^\d{16}$/);
		assert.equal(number.slice(0, 4), brand.numberPrefix);
		assert.notEqual(virtualCardBrand(brand.id), brand.id);
		assert.notEqual(number, newCardNumber(brand.id));
		let sum = 0;
		for (let index = 0; index < number.length; index++) {
			const digit =
				Number(number[number.length - 1 - index]) * (index % 2 ? 2 : 1);
			sum += digit > 9 ? digit - 9 : digit;
		}
		assert.equal(sum % 10, 0);
	}
});

void test("CVV encryption preserves zeroes with a fresh nonce", () => {
	const key = newKey();
	const encrypted = encryptCvv("007", cardNumber, key);
	assert.equal(decryptCvv(encrypted, cardNumber, key), "007");
	assert.notEqual(encrypted, encryptCvv("007", cardNumber, key));
});

void test("CVVs reject wrong cards, keys, tampering and malformed input", () => {
	const key = newKey();
	const encrypted = encryptCvv("007", cardNumber, key);
	assert.throws(
		() => decryptCvv(encrypted, "5555000000000000", key),
		unavailable,
	);
	assert.throws(() => decryptCvv(encrypted, cardNumber, newKey()), unavailable);
	const altered =
		encrypted.slice(0, -1) + (encrypted.endsWith("0") ? "1" : "0");
	assert.throws(() => decryptCvv(altered, cardNumber, key), unavailable);
	assert.throws(() => encryptCvv("007", cardNumber, undefined), unavailable);
	assert.throws(() => encryptCvv("12", cardNumber, key), unavailable);
});
