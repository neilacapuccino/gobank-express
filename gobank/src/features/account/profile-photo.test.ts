import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";
import { normalizeProfilePhoto } from "./profile-photo.server";
import { MAX_PHOTO_BYTES, profilePhotoInput } from "./profile-photo.schema";

const source = () =>
	sharp({
		create: { width: 400, height: 300, channels: 3, background: "#71d5f3" },
	});
void test("removing a photo restores the default avatar", async () => {
	assert.equal(await normalizeProfilePhoto(null), null);
});
void test("raster uploads become square WebP avatars without source metadata", async () => {
	for (const format of ["png", "jpeg", "webp"] as const) {
		const bytes = await source()
			.toFormat(format)
			.withMetadata({ exif: { IFD0: { Artist: "test-fixture" } } })
			.toBuffer();
		const photo = await normalizeProfilePhoto(
			`data:image/${format};base64,${bytes.toString("base64")}`,
		);
		assert.ok(photo);
		assert.ok(photo.startsWith("data:image/webp;base64,"));
		const metadata = await sharp(
			Buffer.from(photo.split(",")[1]!, "base64"),
		).metadata();
		assert.equal(metadata.format, "webp");
		assert.equal(metadata.width, 256);
		assert.equal(metadata.height, 256);
		assert.equal(metadata.exif, undefined);
		assert.equal(metadata.icc, undefined);
	}
});
void test("SVG, remote URLs, malformed bytes and mismatched formats are rejected", async () => {
	const svg = Buffer.from(
		'<svg xmlns="http://www.w3.org/2000/svg"></svg>',
	).toString("base64");
	for (const value of [
		"https://example.com/photo.png",
		`data:image/svg+xml;base64,${svg}`,
		`data:image/png;base64,${svg}`,
		"data:image/png;base64,AAAA",
	]) {
		await assert.rejects(normalizeProfilePhoto(value));
	}
	const jpeg = await source().jpeg().toBuffer();
	await assert.rejects(
		normalizeProfilePhoto(`data:image/png;base64,${jpeg.toString("base64")}`),
	);
});
void test("photo payloads are bounded before image decoding", async () => {
	assert.equal(profilePhotoInput.safeParse("a".repeat(270_001)).success, false);
	const bytes = Buffer.alloc(MAX_PHOTO_BYTES + 1);
	await assert.rejects(
		normalizeProfilePhoto(`data:image/png;base64,${bytes.toString("base64")}`),
		/too large/,
	);
});
