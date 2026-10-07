"use client";

import { MAX_PHOTO_BYTES, PHOTO_TYPES } from "./profile-photo.schema";

export async function prepareProfilePhoto(file: File) {
	if (!PHOTO_TYPES.includes(file.type))
		throw new Error("Choose a PNG, JPG or WebP photo.");
	if (file.size > 5 * 1024 * 1024)
		throw new Error("Choose a photo smaller than 5 MB.");
	const bitmap = await createImageBitmap(file);
	try {
		const canvas = document.createElement("canvas");
		canvas.width = canvas.height = 256;
		const context = canvas.getContext("2d");
		if (!context) throw new Error("Couldn’t prepare this photo.");
		const scale = Math.max(256 / bitmap.width, 256 / bitmap.height);
		const width = bitmap.width * scale,
			height = bitmap.height * scale;
		context.drawImage(
			bitmap,
			(256 - width) / 2,
			(256 - height) / 2,
			width,
			height,
		);
		const photo = canvas.toDataURL("image/webp", 0.82);
		if (photo.length > Math.ceil((MAX_PHOTO_BYTES * 4) / 3) + 30)
			throw new Error("Try a smaller photo.");
		return photo;
	} finally {
		bitmap.close();
	}
}
