import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const cardRouter = createTRPCRouter({
  get: protectedProcedure.query(({ ctx }) =>
    ctx.db.card.findUniqueOrThrow({ where: { userId: ctx.userId } }),
  ),

  update: protectedProcedure
    .input(
      z.object({
        locked: z.boolean().optional(),
        dailyLimit: z.number().int().min(0).max(10_000_000).optional(),
      }),
    )
    .mutation(({ ctx, input }) =>
      ctx.db.card.update({ where: { userId: ctx.userId }, data: input }),
    ),
});
