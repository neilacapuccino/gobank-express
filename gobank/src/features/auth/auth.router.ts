import { z } from "zod";
import { email, mobile, optionalText } from "~/shared/lib/schemas";
import { pin, username } from "./auth.schemas";
import { endSession } from "~/server/session";
import { createTRPCRouter, publicProcedure } from "~/server/trpc";
import { CardBrand } from "../../../generated/prisma";
import { isUsernameFree, register, signIn } from "./auth.service";

export const authRouter = createTRPCRouter({
  usernameAvailable: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(({ input }) => {
      const parsed = username.safeParse(input.username);
      return parsed.success ? isUsernameFree(parsed.data) : false;
    }),

  register: publicProcedure
    .input(
      z.object({
        username,
        pin,
        brand: z.nativeEnum(CardBrand),
        fullName: optionalText(80),
        mobile,
        email,
      }),
    )
    .mutation(({ input }) => register(input)),

  signIn: publicProcedure
    .input(
      z.object({
        username: z
          .string()
          .trim()
          .toLowerCase()
          .transform((value) => value.replace(/^@/, "")),
        pin: z.string(),
      }),
    )
    .mutation(({ input }) => signIn(input.username, input.pin)),

  signOut: publicProcedure.mutation(() => endSession()),
});
