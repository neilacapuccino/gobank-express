import { z } from "zod";

export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_PHOTO_BYTES = 200_000;
export const PHOTO_PATTERN =
  /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/;
export const profilePhotoInput = z
  .string()
  .max(270_000)
  .regex(PHOTO_PATTERN, "Choose a PNG, JPG or WebP photo.")
  .nullable()
  .optional();
