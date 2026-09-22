import { z } from "zod";
import { pointsValue } from "~/lib/money";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { post } from "~/server/services/ledger";

export const rewardsRouter = createTRPCRouter({
  redeem: protectedProcedure
    .input(z.object({ points: z.number().int().min(100) }))
    .mutation(({ ctx, input }) =>
      ctx.db.$transaction((tx) =>
        post(tx, {
          userId: ctx.userId,
          kind: "reward",
          title: `Redeemed ${input.points.toLocaleString()} points`,
          amount: pointsValue(input.points),
          points: -input.points,
        }),
      ),
    ),
});
