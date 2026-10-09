import { z } from "zod";
import { mobile, centavos } from "~/shared/lib/schemas";
import { createTRPCRouter, protectedProcedure } from "~/server/trpc";
import { MAX_LOAD_CENTAVOS, MIN_LOAD_CENTAVOS } from "./load.rules";
import { buyLoad } from "./load.service";

export const loadRouter = createTRPCRouter({
	buy: protectedProcedure
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
