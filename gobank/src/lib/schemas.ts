import { z } from "zod";
import {
  normaliseMobile,
  validateEmail,
  validateMobile,
  validatePin,
  validateUsername,
} from "./registration";

const blankToNull = (value: string) => value || null;

export const centavos = z.number().int().positive().max(100_000_000);

export const pin = z
  .string()
  .regex(/^\d{6}$/, "Use 6 digits")
  .refine((value) => !validatePin(value), "Choose a harder PIN");

export const username = z
  .string()
  .trim()
  .toLowerCase()
  .refine(
    (value) => validateUsername(value).state === "available",
    "Choose another username",
  );

export const mobile = z
  .string()
  .trim()
  .refine((value) => !validateMobile(value), "Use the format 09XXXXXXXXX")
  .transform((value) => blankToNull(normaliseMobile(value)));

export const email = z
  .string()
  .trim()
  .toLowerCase()
  .refine((value) => !validateEmail(value), "That does not look like an email")
  .transform(blankToNull);

export const optionalText = (max: number) =>
  z.string().trim().max(max).transform(blankToNull);
