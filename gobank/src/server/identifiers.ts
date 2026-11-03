import { randomInt } from "node:crypto";

const REFERENCE_CHARACTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const DIGITS = "0123456789";

const randomString = (characters: string, length: number) =>
	Array.from({ length }, () => characters[randomInt(characters.length)]).join(
		"",
	);

export const newReference = () => `GB${randomString(REFERENCE_CHARACTERS, 8)}`;

export const newAccountNumber = () => `20${randomString(DIGITS, 9)}`;
