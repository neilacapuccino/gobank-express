import { z } from "zod";
import { validatePin, validateUsername } from "./auth.rules";

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
