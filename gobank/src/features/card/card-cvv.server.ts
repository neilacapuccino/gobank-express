import "server-only";
import {
	createCipheriv,
	createDecipheriv,
	randomBytes,
	randomInt,
} from "node:crypto";
import { fail } from "~/server/errors";

const ALGORITHM = "aes-256-gcm";
const FORMAT_VERSION = "v1";
const ENCRYPTED_CVV = /^v1\.[a-f0-9]{24}\.[a-f0-9]{32}\.[a-f0-9]{6}$/i;
const THREE_DIGITS = /^\d{3}$/;
const HEX_KEY = /^[a-f0-9]{64}$/i;

const UNAVAILABLE = "Your card security details are temporarily unavailable.";

const additionalData = (cardNumber: string) =>
	Buffer.from(`GoBank card CVV:${cardNumber}`);

function encryptionKey(key: string | undefined) {
	if (!key || !HEX_KEY.test(key)) return fail("BAD_REQUEST", UNAVAILABLE);

	return Buffer.from(key, "hex");
}

function randomCvv(excludedCvv?: string) {
	let cvv: string;
	do {
		cvv = randomInt(1000).toString().padStart(3, "0");
	} while (cvv === excludedCvv);

	return cvv;
}

export function newCvvCredentials(
	cardNumber: string,
	key: string | undefined,
	excludedCvv?: string,
) {
	const cvv = randomCvv(excludedCvv);

	return { cvv, cvvEncrypted: encryptCvv(cvv, cardNumber, key) };
}

export function encryptCvv(
	cvv: string,
	cardNumber: string,
	key: string | undefined,
) {
	if (!THREE_DIGITS.test(cvv)) fail("BAD_REQUEST", UNAVAILABLE);

	const nonce = randomBytes(12);
	const cipher = createCipheriv(ALGORITHM, encryptionKey(key), nonce);
	cipher.setAAD(additionalData(cardNumber));

	const ciphertext = Buffer.concat([
		cipher.update(cvv, "utf8"),
		cipher.final(),
	]);
	const tag = cipher.getAuthTag();

	return [
		FORMAT_VERSION,
		nonce.toString("hex"),
		tag.toString("hex"),
		ciphertext.toString("hex"),
	].join(".");
}

export function decryptCvv(
	encrypted: string,
	cardNumber: string,
	key: string | undefined,
) {
	const secret = encryptionKey(key);
	if (!ENCRYPTED_CVV.test(encrypted)) fail("BAD_REQUEST", UNAVAILABLE);

	const [, nonce = "", tag = "", ciphertext = ""] = encrypted.split(".");

	try {
		const decipher = createDecipheriv(
			ALGORITHM,
			secret,
			Buffer.from(nonce, "hex"),
		);
		decipher.setAAD(additionalData(cardNumber));
		decipher.setAuthTag(Buffer.from(tag, "hex"));

		const cvv = Buffer.concat([
			decipher.update(Buffer.from(ciphertext, "hex")),
			decipher.final(),
		]).toString("utf8");

		if (!THREE_DIGITS.test(cvv)) fail("BAD_REQUEST", UNAVAILABLE);
		return cvv;
	} catch {
		return fail("BAD_REQUEST", UNAVAILABLE);
	}
}
