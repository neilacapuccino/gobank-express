import { randomInt } from "node:crypto";

const REFERENCE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const pick = (alphabet: string, length: number) =>
	Array.from({ length }, () => alphabet[randomInt(alphabet.length)]).join("");

export const newReference = () => `GB${pick(REFERENCE_ALPHABET, 8)}`;

export const newAccountNumber = () => `20${pick("0123456789", 9)}`;
