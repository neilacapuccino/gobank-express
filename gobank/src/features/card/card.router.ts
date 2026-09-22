import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/trpc";
import { getCard, updateCard } from "./card.service";

export const cardRouter = createTRPCRouter({
  get: protectedProcedure.query(({ ctx }) => getCard(ctx.userId)),

  update: protectedProcedure
    .input(
      z.object({
        locked: z.boolean().optional(),
        dailyLimit: z.number().int().min(0).max(10_000_000).optional(),
      }),
    )
    .mutation(({ ctx, input }) => updateCard(ctx.userId, input)),
});
