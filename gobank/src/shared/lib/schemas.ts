import { z } from "zod";
import { normalizeMobile, validateMobile } from "./contact";
import { MAX_TRANSACTION_CENTAVOS } from "./money";

const blankToNull = (value: string) => value || null;

export const centavos = z
	.number()
	.int()
	.positive()
	.max(MAX_TRANSACTION_CENTAVOS);

export const mobile = z
	.string()
	.trim()
	.refine((value) => !validateMobile(value), "Use the format 09XXXXXXXXX")
	.transform((value) => blankToNull(normalizeMobile(value)));

export const optionalText = (max: number) =>
	z.string().trim().max(max).transform(blankToNull);

export const profileFields = {
	fullName: z.string().trim().min(2, "Enter your full name").max(80),
	mobile,
};
