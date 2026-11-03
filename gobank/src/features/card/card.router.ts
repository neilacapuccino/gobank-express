import { z } from "zod";
import { cardKind } from "~/shared/lib/schemas";
import { createTRPCRouter, protectedProcedure } from "~/server/trpc";
import { getCard, revealCvv, updateCard } from "./card.service";
import { MAX_DAILY_LIMIT_CENTAVOS } from "./card.rules";

export const cardRouter = createTRPCRouter({
	get: protectedProcedure.query(({ ctx }) => getCard(ctx.userId)),
	revealCvv: protectedProcedure
		.input(z.object({ kind: cardKind }))
		.query(({ ctx, input }) => revealCvv(ctx.userId, input.kind)),

	update: protectedProcedure
		.input(
			z.object({
				lock: z.object({ kind: cardKind, locked: z.boolean() }).optional(),
				cardDailyLimit: z
					.number()
					.int()
					.min(0)
					.max(MAX_DAILY_LIMIT_CENTAVOS)
					.optional(),
			}),
		)
		.mutation(({ ctx, input }) => updateCard(ctx.userId, input)),
});
