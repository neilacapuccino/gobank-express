import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/trpc";
import { createCvv, getCard, revealCvv, updateCard } from "./card.service";
import { MAX_DAILY_LIMIT_CENTAVOS } from "./card.rules";

export const cardRouter = createTRPCRouter({
	get: protectedProcedure.query(({ ctx }) => getCard(ctx.userId)),
	revealCvv: protectedProcedure.query(({ ctx }) => revealCvv(ctx.userId)),
	createCvv: protectedProcedure.mutation(({ ctx }) => createCvv(ctx.userId)),

	update: protectedProcedure
		.input(
			z.object({
				locked: z.boolean().optional(),
				dailyLimit: z
					.number()
					.int()
					.min(0)
					.max(MAX_DAILY_LIMIT_CENTAVOS)
					.optional(),
			}),
		)
		.mutation(({ ctx, input }) => updateCard(ctx.userId, input)),
});
