import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/trpc";
import { redeemPoints } from "./rewards.service";

export const rewardsRouter = createTRPCRouter({
  redeem: protectedProcedure
    .input(z.object({ points: z.number().int().min(100) }))
    .mutation(({ ctx, input }) => redeemPoints(ctx.userId, input.points)),
});
