import { z } from "zod";
import { cardKind, centavos, optionalText } from "~/shared/lib/schemas";
import { createTRPCRouter, protectedProcedure } from "~/server/trpc";
import {
	cancelRequest,
	requestMoney,
	respondToRequest,
} from "./requests.service";
import { MAX_REQUEST_CENTAVOS } from "./requests.rules";

export const requestsRouter = createTRPCRouter({
	create: protectedProcedure
		.input(
			z.object({
				from: z.string().trim().min(1),
				amount: centavos.max(MAX_REQUEST_CENTAVOS),
				note: optionalText(120),
			}),
		)
		.mutation(({ ctx, input }) =>
			requestMoney(ctx.userId, input.from, input.amount, input.note),
		),

	respond: protectedProcedure
		.input(
			z.object({
				id: z.string().min(1),
				accept: z.boolean(),
				card: cardKind.default("physical"),
			}),
		)
		.mutation(({ ctx, input }) =>
			respondToRequest(ctx.userId, input.id, input.accept, input.card),
		),

	cancel: protectedProcedure
		.input(z.object({ id: z.string().min(1) }))
		.mutation(({ ctx, input }) => cancelRequest(ctx.userId, input.id)),
});
