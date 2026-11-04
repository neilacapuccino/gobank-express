import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";
import {
	isGooglePhotoUrl,
	normalizeProfilePhoto,
} from "./profile-photo.server";
import { MAX_PHOTO_BYTES } from "./profile-photo.schema";

const toDataUrl = (bytes: Buffer, type = "png") =>
	`data:image/${type};base64,${bytes.toString("base64")}`;

const fromDataUrl = (photo: string) =>
	Buffer.from(photo.split(",")[1] ?? "", "base64");

void test("a photo becomes a 256 by 256 WebP without hidden metadata", async () => {
	const original = await sharp({
		create: { width: 400, height: 300, channels: 3, background: "#71d5f3" },
	})
		.png()
		.withMetadata({ exif: { IFD0: { Artist: "test" } } })
		.toBuffer();

	const photo = await normalizeProfilePhoto(toDataUrl(original));
	assert.ok(photo);
	assert.ok(photo.startsWith("data:image/webp;base64,"));

	const metadata = await sharp(fromDataUrl(photo)).metadata();
	assert.equal(metadata.format, "webp");
	assert.deepEqual([metadata.width, metadata.height], [256, 256]);
	assert.equal(metadata.exif, undefined);
	assert.equal(metadata.icc, undefined);
});

void test("removing the photo saves nothing", async () => {
	assert.equal(await normalizeProfilePhoto(null), null);
});

void test("links, SVGs and broken images are rejected", async () => {
	const invalidPhotos = [
		"https://example.com/photo.png",
		"data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=",
		"data:image/png;base64,AAAA",
	];

	for (const value of invalidPhotos) {
		await assert.rejects(normalizeProfilePhoto(value));
	}
});

void test("a photo over the size limit is rejected", async () => {
	const tooLarge = Buffer.alloc(MAX_PHOTO_BYTES + 1);

	await assert.rejects(normalizeProfilePhoto(toDataUrl(tooLarge)), /too large/);
});

void test("only Google's own photo links are downloaded at sign-up", () => {
	const googlePhoto = "https://lh3.googleusercontent.com/a/photo=s96-c";

	assert.equal(isGooglePhotoUrl(googlePhoto), true);
	assert.equal(isGooglePhotoUrl(googlePhoto.replace("https", "http")), false);
	assert.equal(
		isGooglePhotoUrl("https://googleusercontent.com.evil.test/a"),
		false,
	);
	assert.equal(
		isGooglePhotoUrl("https://evil.test/googleusercontent.com"),
		false,
	);
	assert.equal(isGooglePhotoUrl("not a link"), false);
});
