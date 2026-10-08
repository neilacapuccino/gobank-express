import { z } from "zod";
import { centavos, mobile } from "~/shared/lib/schemas";
import { createTRPCRouter, protectedProcedure } from "~/server/trpc";
import { buyLoad, deposit } from "./wallet.service";
import {
	MAX_DEPOSIT_CENTAVOS,
	MAX_LOAD_CENTAVOS,
	MIN_LOAD_CENTAVOS,
} from "./wallet.rules";

export const walletRouter = createTRPCRouter({
	deposit: protectedProcedure
		.input(z.object({ amount: centavos.max(MAX_DEPOSIT_CENTAVOS) }))
		.mutation(({ ctx, input }) => deposit(ctx.userId, input.amount)),

	load: protectedProcedure
		.input(
			z.object({
				mobile: mobile.pipe(z.string({ message: "Enter a mobile number" })),
				amount: centavos.min(MIN_LOAD_CENTAVOS).max(MAX_LOAD_CENTAVOS),
			}),
		)
		.mutation(({ ctx, input }) =>
			buyLoad(ctx.userId, input.mobile, input.amount),
		),
});
