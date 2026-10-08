import { z } from "zod";
import { PIN_LENGTH, validatePin, validateUsername } from "./auth.rules";

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
