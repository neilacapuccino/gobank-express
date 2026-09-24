import { z } from "zod";
import { validatePin, validateUsername } from "./auth.rules";

export const pin = z
  .string()
  .regex(/^\d{6}$/, "Use 6 digits")
  .refine((value) => !validatePin(value), "Choose a harder PIN");

export const pinChange = z
  .object({ currentPin: z.string(), newPin: pin })
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
