import { z } from "zod";
import { MAX_REWARD_POINTS, MIN_REDEEM_POINTS } from "~/shared/lib/money";
import { createTRPCRouter, protectedProcedure } from "~/server/trpc";
import { redeemPoints } from "./rewards.service";

export const rewardsRouter = createTRPCRouter({
	redeem: protectedProcedure
		.input(
			z.object({
				points: z.number().int().min(MIN_REDEEM_POINTS).max(MAX_REWARD_POINTS),
			}),
		)
		.mutation(({ ctx, input }) => redeemPoints(ctx.userId, input.points)),
});
