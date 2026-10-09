import { z } from "zod";
import { PIN_LENGTH, validatePin, validateUsername } from "./auth.rules";
import {
	isSupportedCardBrand,
	type CardBrandId,
} from "~/features/card/card-brands";

export const cardBrand = z.custom<CardBrandId>(
	isSupportedCardBrand,
	"Choose a supported card network",
);

export const pinDigits = z
	.string()
	.regex(/^\d{6}$/, `Use ${PIN_LENGTH} digits`);

export const pin = pinDigits.superRefine((value, context) => {
	const message = validatePin(value);
	if (message) context.addIssue({ code: z.ZodIssueCode.custom, message });
});

export const pinChange = z
	.object({ currentPin: pinDigits, newPin: pin })
	.refine((input) => input.currentPin !== input.newPin, {
		message: "Choose a different PIN",
		path: ["newPin"],
	});

export const username = z
	.string()
	.trim()
	.toLowerCase()
	.refine(
		(value) => validateUsername(value).state === "available",
		"Choose another username",
	);
