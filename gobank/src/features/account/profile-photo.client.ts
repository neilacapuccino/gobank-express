"use client";

import { MAX_PHOTO_BYTES, PHOTO_TYPES } from "./profile-photo.schema";

const AVATAR_SIZE = 256;
const WEBP_QUALITY = 0.82;
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const MAX_DATA_URL_LENGTH = Math.ceil((MAX_PHOTO_BYTES * 4) / 3) + 30;

function drawCovering(context: CanvasRenderingContext2D, image: ImageBitmap) {
	const scale = Math.max(AVATAR_SIZE / image.width, AVATAR_SIZE / image.height);
	const width = image.width * scale;
	const height = image.height * scale;

	const left = (AVATAR_SIZE - width) / 2;
	const top = (AVATAR_SIZE - height) / 2;

	context.drawImage(image, left, top, width, height);
}

export async function prepareProfilePhoto(file: File) {
	if (!PHOTO_TYPES.includes(file.type)) {
		throw new Error("Choose a PNG, JPG or WebP photo.");
	}

	if (file.size > MAX_UPLOAD_BYTES) {
		throw new Error("Choose a photo smaller than 5 MB.");
	}

	const image = await createImageBitmap(file);

	try {
		const canvas = document.createElement("canvas");
		canvas.width = AVATAR_SIZE;
		canvas.height = AVATAR_SIZE;

		const context = canvas.getContext("2d");
		if (!context) throw new Error("Couldn’t prepare this photo.");

		drawCovering(context, image);

		const photo = canvas.toDataURL("image/webp", WEBP_QUALITY);
		if (photo.length > MAX_DATA_URL_LENGTH) {
			throw new Error("Try a smaller photo.");
		}

		return photo;
	} finally {
		image.close();
	}
}
