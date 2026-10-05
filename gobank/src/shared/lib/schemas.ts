import { z } from "zod";
import { normaliseMobile, validateMobile } from "./contact";

const blankToNull = (value: string) => value || null;

export const centavos = z.number().int().positive().max(100_000_000);

export const mobile = z
  .string()
  .trim()
  .refine((value) => !validateMobile(value), "Use the format 09XXXXXXXXX")
  .transform((value) => blankToNull(normaliseMobile(value)));

export const optionalText = (max: number) =>
  z.string().trim().max(max).transform(blankToNull);

export const profileFields = {
  fullName: z.string().trim().min(2, "Enter your full name").max(80),
  mobile,
};
