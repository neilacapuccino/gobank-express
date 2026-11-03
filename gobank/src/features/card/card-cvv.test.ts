import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import test from "node:test";
import { cardBrand } from "~/features/auth/auth.schemas";
import { AppError } from "~/server/errors";
import { CARD_BRANDS } from "./card-brands";
import { decryptCvv, encryptCvv } from "./card-cvv.server";
import { newCardNumber, virtualCardBrand } from "./card-generation.server";

const CARD_NUMBER = "4242000000000000";
const OTHER_CARD_NUMBER = "5555000000000000";

const newKey = () => randomBytes(32).toString("hex");

const isUnavailableError = (error: unknown) =>
	error instanceof AppError &&
	error.code === "BAD_REQUEST" &&
	error.message === "Your card security details are temporarily unavailable.";

function passesLuhnCheck(cardNumber: string) {
	const digitsFromRight = [...cardNumber].reverse().map(Number);

	const sum = digitsFromRight.reduce((total, digit, index) => {
		const value = index % 2 === 1 ? digit * 2 : digit;
		return total + (value > 9 ? value - 9 : value);
	}, 0);

	return sum % 10 === 0;
}

void test("only the four supported card networks are accepted", () => {
	const networks = CARD_BRANDS.map((brand) => brand.id);

	assert.deepEqual(networks, ["visa", "mastercard", "jcb", "discover"]);
	assert.equal(cardBrand.safeParse("gobank").success, false);
});

void test("new card numbers have 16 digits, the network prefix and a valid check digit", () => {
	for (const brand of CARD_BRANDS) {
		const number = newCardNumber(brand.id);

		assert.match(number, /^\d{16}$/);
		assert.equal(number.slice(0, 4), brand.numberPrefix);
		assert.ok(passesLuhnCheck(number));
		assert.notEqual(number, newCardNumber(brand.id));
	}
});

void test("the virtual card always uses a different network", () => {
	for (const brand of CARD_BRANDS) {
		assert.notEqual(virtualCardBrand(brand.id), brand.id);
	}
});

void test("an encrypted CVV decrypts back with its leading zeros", () => {
	const key = newKey();
	const encrypted = encryptCvv("007", CARD_NUMBER, key);

	assert.equal(decryptCvv(encrypted, CARD_NUMBER, key), "007");
});

void test("encrypting the same CVV twice gives two different results", () => {
	const key = newKey();

	const first = encryptCvv("007", CARD_NUMBER, key);
	const second = encryptCvv("007", CARD_NUMBER, key);

	assert.notEqual(first, second);
});

void test("a CVV cannot be read with the wrong card or the wrong key", () => {
	const key = newKey();
	const encrypted = encryptCvv("007", CARD_NUMBER, key);

	assert.throws(
		() => decryptCvv(encrypted, OTHER_CARD_NUMBER, key),
		isUnavailableError,
	);
	assert.throws(
		() => decryptCvv(encrypted, CARD_NUMBER, newKey()),
		isUnavailableError,
	);
});

void test("a CVV that was changed after encryption is rejected", () => {
	const key = newKey();
	const encrypted = encryptCvv("007", CARD_NUMBER, key);

	const newLastCharacter = encrypted.endsWith("0") ? "1" : "0";
	const tampered = encrypted.slice(0, -1) + newLastCharacter;

	assert.throws(
		() => decryptCvv(tampered, CARD_NUMBER, key),
		isUnavailableError,
	);
});

void test("encryption needs a key and a 3-digit CVV", () => {
	assert.throws(
		() => encryptCvv("007", CARD_NUMBER, undefined),
		isUnavailableError,
	);
	assert.throws(
		() => encryptCvv("12", CARD_NUMBER, newKey()),
		isUnavailableError,
	);
});
