import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/trpc";
import { ACTIVITY_FILTERS } from "./activity.rules";
import { getTransaction, listActivity } from "./activity.service";

export const activityRouter = createTRPCRouter({
	list: protectedProcedure
		.input(
			z.object({
				filter: z.enum(ACTIVITY_FILTERS).default("all"),
				cursor: z.string().nullish(),
				limit: z.number().int().min(1).max(50).default(20),
			}),
		)
		.query(({ ctx, input }) =>
			listActivity(ctx.userId, input.cursor, input.limit, input.filter),
		),

	transaction: protectedProcedure
		.input(z.object({ reference: z.string() }))
		.query(({ ctx, input }) => getTransaction(ctx.userId, input.reference)),
});
