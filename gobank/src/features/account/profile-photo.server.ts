import "server-only";
import sharp from "sharp";
import { fail } from "~/server/errors";
import {
	MAX_PHOTO_BYTES,
	PHOTO_PATTERN,
	profilePhotoInput,
} from "./profile-photo.schema";

const AVATAR_SIZE = 256;
const MAX_PIXELS = 16_777_216;
const MAX_GOOGLE_PHOTO_BYTES = 5 * 1024 * 1024;
const GOOGLE_PHOTO_HOST = /(^|\.)googleusercontent\.com$/;

async function toAvatar(bytes: Buffer, expectedFormat?: string) {
	const image = sharp(bytes, { limitInputPixels: MAX_PIXELS });
	const metadata = await image.metadata();

	const wrongFormat = expectedFormat && metadata.format !== expectedFormat;
	if (wrongFormat || (metadata.pages ?? 1) > 1) {
		throw new Error("Unsupported photo");
	}

	const avatar = await image
		.rotate()
		.resize(AVATAR_SIZE, AVATAR_SIZE, { fit: "cover" })
		.webp({ quality: 82 })
		.toBuffer();

	return `data:image/webp;base64,${avatar.toString("base64")}`;
}

export async function normalizeProfilePhoto(value: string | null) {
	if (value === null) return null;

	const match = PHOTO_PATTERN.exec(value);
	if (!match || !profilePhotoInput.safeParse(value).success) {
		return fail("BAD_REQUEST", "Choose a valid PNG, JPG or WebP photo.");
	}

	const [, format, base64 = ""] = match;
	const bytes = Buffer.from(base64, "base64");
	if (bytes.length > MAX_PHOTO_BYTES) {
		fail("BAD_REQUEST", "Photo is too large. Choose a smaller image.");
	}

	try {
		return await toAvatar(bytes, format);
	} catch {
		return fail(
			"BAD_REQUEST",
			"Couldn’t read that photo. Choose a PNG, JPG or WebP.",
		);
	}
}

export function isGooglePhotoUrl(value: string) {
	try {
		const url = new URL(value);
		return url.protocol === "https:" && GOOGLE_PHOTO_HOST.test(url.hostname);
	} catch {
		return false;
	}
}

const largerGooglePhoto = (url: string) =>
	url.replace(/=s\d+(-c)?$/, `=s${AVATAR_SIZE}-c`);

export async function photoFromGoogle(url: string | null | undefined) {
	if (!url || !isGooglePhotoUrl(url)) return null;

	try {
		const reply = await fetch(largerGooglePhoto(url), {
			cache: "no-store",
			redirect: "error",
			signal: AbortSignal.timeout(8_000),
		});
		if (!reply.ok) return null;

		const bytes = Buffer.from(await reply.arrayBuffer());
		if (bytes.length > MAX_GOOGLE_PHOTO_BYTES) return null;

		return await toAvatar(bytes);
	} catch {
		return null;
	}
}
