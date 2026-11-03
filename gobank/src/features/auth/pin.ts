import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const KEY_LENGTH = 64;
const STORED_HASH = /^[a-f0-9]{32}:[a-f0-9]{128}$/i;

const deriveKey = promisify(scrypt) as (
	pin: string,
	salt: string,
	length: number,
) => Promise<Buffer>;

export async function hashPin(pin: string) {
	const salt = randomBytes(16).toString("hex");
	const key = await deriveKey(pin, salt, KEY_LENGTH);

	return `${salt}:${key.toString("hex")}`;
}

export async function verifyPin(pin: string, stored: string) {
	if (!STORED_HASH.test(stored)) return false;

	const [salt = "", hash = ""] = stored.split(":");
	const key = await deriveKey(pin, salt, KEY_LENGTH);

	return timingSafeEqual(key, Buffer.from(hash, "hex"));
}
