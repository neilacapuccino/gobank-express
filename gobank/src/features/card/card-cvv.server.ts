import "server-only";
import {
	createCipheriv,
	createDecipheriv,
	randomBytes,
	randomInt,
} from "node:crypto";
import { hashPin } from "~/features/auth/pin";
import { fail } from "~/server/errors";

const UNAVAILABLE = "Your card security details are temporarily unavailable.";

const encryptionKey = (key: string | undefined) => {
	if (!key || !/^[a-f0-9]{64}$/i.test(key)) fail("BAD_REQUEST", UNAVAILABLE);
	return Buffer.from(key, "hex");
};

export async function newCvvCredentials(
	cardNumber: string,
	key: string | undefined,
	excludedCvv?: string,
) {
	let cvv: string;
	do cvv = randomInt(1000).toString().padStart(3, "0");
	while (cvv === excludedCvv);
	const cvvEncrypted = encryptCvv(cvv, cardNumber, key);
	return { cvv, cvvEncrypted, cvvHash: await hashPin(cvv) };
}

export function encryptCvv(
	cvv: string,
	cardNumber: string,
	key: string | undefined,
) {
	if (!/^\d{3}$/.test(cvv)) fail("BAD_REQUEST", UNAVAILABLE);
	const nonce = randomBytes(12);
	const cipher = createCipheriv("aes-256-gcm", encryptionKey(key), nonce);
	cipher.setAAD(Buffer.from(`GoBank card CVV:${cardNumber}`));
	const ciphertext = Buffer.concat([
		cipher.update(cvv, "utf8"),
		cipher.final(),
	]);
	return `v1.${nonce.toString("hex")}.${cipher.getAuthTag().toString("hex")}.${ciphertext.toString("hex")}`;
}

export function decryptCvv(
	encrypted: string,
	cardNumber: string,
	key: string | undefined,
) {
	const secret = encryptionKey(key);
	if (!/^v1\.[a-f0-9]{24}\.[a-f0-9]{32}\.[a-f0-9]{6}$/i.test(encrypted))
		fail("BAD_REQUEST", UNAVAILABLE);
	const [, nonce = "", tag = "", ciphertext = ""] = encrypted.split(".");
	try {
		const decipher = createDecipheriv(
			"aes-256-gcm",
			secret,
			Buffer.from(nonce, "hex"),
		);
		decipher.setAAD(Buffer.from(`GoBank card CVV:${cardNumber}`));
		decipher.setAuthTag(Buffer.from(tag, "hex"));
		const cvv = Buffer.concat([
			decipher.update(Buffer.from(ciphertext, "hex")),
			decipher.final(),
		]).toString("utf8");
		if (!/^\d{3}$/.test(cvv)) fail("BAD_REQUEST", UNAVAILABLE);
		return cvv;
	} catch {
		return fail("BAD_REQUEST", UNAVAILABLE);
	}
}
