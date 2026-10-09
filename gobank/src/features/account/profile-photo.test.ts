import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";
import { normalizeProfilePhoto } from "./profile-photo.server";
import { MAX_PHOTO_BYTES } from "./profile-photo.schema";

void test("photos become square WebP avatars without metadata and can be removed", async () => {
	const bytes = await sharp({
		create: { width: 400, height: 300, channels: 3, background: "#71d5f3" },
	})
		.png()
		.withMetadata({ exif: { IFD0: { Artist: "test" } } })
		.toBuffer();
	const photo = await normalizeProfilePhoto(
		`data:image/png;base64,${bytes.toString("base64")}`,
	);
	assert.ok(photo);
	assert.ok(photo.startsWith("data:image/webp;base64,"));
	const metadata = await sharp(
		Buffer.from(photo.split(",")[1]!, "base64"),
	).metadata();
	assert.equal(metadata.format, "webp");
	assert.deepEqual([metadata.width, metadata.height], [256, 256]);
	assert.equal(metadata.exif, undefined);
	assert.equal(metadata.icc, undefined);
	assert.equal(await normalizeProfilePhoto(null), null);
});

void test("invalid, remote and oversized photos are rejected", async () => {
	for (const value of [
		"https://example.com/photo.png",
		"data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=",
		"data:image/png;base64,AAAA",
	])
		await assert.rejects(normalizeProfilePhoto(value));
	const bytes = Buffer.alloc(MAX_PHOTO_BYTES + 1);
	await assert.rejects(
		normalizeProfilePhoto(`data:image/png;base64,${bytes.toString("base64")}`),
		/too large/,
	);
});
