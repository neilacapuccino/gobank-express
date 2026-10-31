import { z } from "zod";
import { MAX_REWARD_POINTS, MIN_REDEEM_POINTS } from "~/shared/lib/money";
import { createTRPCRouter, protectedProcedure } from "~/server/trpc";
import {
	getRewardsSummary,
	listRewardActivity,
	redeemPoints,
} from "./rewards.service";

export const rewardsRouter = createTRPCRouter({
	summary: protectedProcedure.query(({ ctx }) => getRewardsSummary(ctx.userId)),
	history: protectedProcedure
		.input(
			z.object({
				cursor: z.string().nullish(),
				limit: z.number().int().min(1).max(50).default(20),
			}),
		)
		.query(({ ctx, input }) =>
			listRewardActivity(ctx.userId, input.cursor, input.limit),
		),
	redeem: protectedProcedure
		.input(
			z.object({
				points: z
					.number()
					.int()
					.min(MIN_REDEEM_POINTS)
					.max(MAX_REWARD_POINTS)
					.refine((value) => value % MIN_REDEEM_POINTS === 0, {
						message: `Redeem in multiples of ${MIN_REDEEM_POINTS} points.`,
					}),
			}),
		)
		.mutation(({ ctx, input }) => redeemPoints(ctx.userId, input.points)),
});
