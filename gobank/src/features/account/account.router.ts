import { z } from "zod";
import { profileFields } from "~/shared/lib/schemas";
import { createTRPCRouter, protectedProcedure } from "~/server/trpc";
import {
  getOverview,
  getProfile,
  getTransaction,
  listActivity,
  updateProfile,
} from "./account.service";

export const accountRouter = createTRPCRouter({
  overview: protectedProcedure.query(({ ctx }) => getOverview(ctx.userId)),

  profile: protectedProcedure.query(({ ctx }) => getProfile(ctx.userId)),

  updateProfile: protectedProcedure
    .input(z.object(profileFields))
    .mutation(({ ctx, input }) => updateProfile(ctx.userId, input)),

  activity: protectedProcedure
    .input(
      z.object({
        cursor: z.string().nullish(),
        limit: z.number().int().min(1).max(50).default(20),
      }),
    )
    .query(({ ctx, input }) =>
      listActivity(ctx.userId, input.cursor, input.limit),
    ),

  transaction: protectedProcedure
    .input(z.object({ reference: z.string() }))
    .query(({ ctx, input }) => getTransaction(ctx.userId, input.reference)),
});
