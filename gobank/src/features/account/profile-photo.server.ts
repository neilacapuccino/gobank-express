import "server-only";
import sharp from "sharp";
import { fail } from "~/server/errors";
import {
	MAX_PHOTO_BYTES,
	PHOTO_PATTERN,
	profilePhotoInput,
} from "./profile-photo.schema";

export async function normalizeProfilePhoto(value: string | null) {
	if (value === null) return null;
	if (!profilePhotoInput.safeParse(value).success)
		fail("BAD_REQUEST", "Choose a valid PNG, JPG or WebP photo.");
	const match = PHOTO_PATTERN.exec(value)!;
	const bytes = Buffer.from(match[2]!, "base64");
	if (bytes.length > MAX_PHOTO_BYTES)
		fail("BAD_REQUEST", "Photo is too large. Choose a smaller image.");
	const format = match[1];
	try {
		const image = sharp(bytes, { limitInputPixels: 16_777_216 });
		const metadata = await image.metadata();
		if (metadata.format !== format || (metadata.pages ?? 1) > 1)
			throw new Error("Unsupported photo");
		const result = await image
			.rotate()
			.resize(256, 256, { fit: "cover" })
			.webp({ quality: 82 })
			.toBuffer();
		return `data:image/webp;base64,${result.toString("base64")}`;
	} catch {
		return fail(
			"BAD_REQUEST",
			"Couldn’t read that photo. Choose a PNG, JPG or WebP.",
		);
	}
}
