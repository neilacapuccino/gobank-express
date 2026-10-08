import { z } from "zod";
import { centavos, optionalText } from "~/shared/lib/schemas";
import { createTRPCRouter, protectedProcedure } from "~/server/trpc";
import {
	cancelRequest,
	listRequests,
	requestMoney,
	respondToRequest,
} from "./requests.service";
import { MAX_REQUEST_CENTAVOS } from "./requests.rules";

export const requestsRouter = createTRPCRouter({
	list: protectedProcedure
		.input(
			z.object({
				requestDirection: z.enum(["received", "sent"]),
				cursor: z.string().min(1).nullish(),
				limit: z.number().int().min(1).max(50).default(20),
			}),
		)
		.query(({ ctx, input }) =>
			listRequests(
				ctx.userId,
				input.requestDirection,
				input.cursor,
				input.limit,
			),
		),

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
		.input(z.object({ id: z.string().min(1), accept: z.boolean() }))
		.mutation(({ ctx, input }) =>
			respondToRequest(ctx.userId, input.id, input.accept),
		),

	cancel: protectedProcedure
		.input(z.object({ id: z.string().min(1) }))
		.mutation(({ ctx, input }) => cancelRequest(ctx.userId, input.id)),
});
