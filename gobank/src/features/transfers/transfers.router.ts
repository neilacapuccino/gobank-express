import { z } from "zod";
import { centavos, optionalText } from "~/shared/lib/schemas";
import { createTRPCRouter, protectedProcedure } from "~/server/trpc";
import {
	findRecipient,
	getRecentRecipients,
	sendMoney,
} from "./transfers.service";

export const transfersRouter = createTRPCRouter({
	recent: protectedProcedure.query(({ ctx }) =>
		getRecentRecipients(ctx.userId),
	),

	recipient: protectedProcedure
		.input(z.object({ to: z.string().trim().min(1) }))
		.query(({ ctx, input }) => findRecipient(input.to, ctx.userId)),

	send: protectedProcedure
		.input(
			z.object({
				to: z.string().trim().min(1),
				amount: centavos,
				note: optionalText(120),
			}),
		)
		.mutation(({ ctx, input }) =>
			sendMoney(ctx.userId, input.to, input.amount, input.note),
		),
});
