import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { email, mobile, optionalText, pin, username } from "~/lib/schemas";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { hashPin, verifyPin } from "~/server/auth/pin";
import { endSession, startSession } from "~/server/auth/session";
import { cardExpiry, newAccountNumber, newCardNumber } from "~/server/codes";

export const authRouter = createTRPCRouter({
  usernameAvailable: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ ctx, input }) => {
      const parsed = username.safeParse(input.username);
      if (!parsed.success) return false;
      const taken = await ctx.db.user.findUnique({
        where: { username: parsed.data },
        select: { id: true },
      });
      return !taken;
    }),

  register: publicProcedure
    .input(
      z.object({
        username,
        pin,
        brand: z.enum(["visa", "mastercard", "jcb", "gobank"]),
        fullName: optionalText(80),
        mobile,
        email,
      }),
    )
    .mutation(async ({ ctx, input: { pin, brand, ...profile } }) => {
      const user = await ctx.db.user.create({
        data: {
          ...profile,
          pinHash: await hashPin(pin),
          accountNumber: newAccountNumber(),
          card: {
            create: {
              brand,
              number: newCardNumber(brand),
              expiresAt: cardExpiry(),
            },
          },
        },
        select: { id: true, accountNumber: true, card: true },
      });
      await startSession(user.id);
      return { accountNumber: user.accountNumber, card: user.card };
    }),

  signIn: publicProcedure
    .input(
      z.object({
        username: z.string().trim().toLowerCase(),
        pin: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { username: input.username.replace(/^@/, "") },
      });
      if (!user || !(await verifyPin(input.pin, user.pinHash))) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Wrong username or PIN",
        });
      }
      await startSession(user.id);
    }),

  signOut: publicProcedure.mutation(() => endSession()),
});
