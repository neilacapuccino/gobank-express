import { z } from "zod";
import { centavos } from "~/shared/lib/schemas";
import { createTRPCRouter, protectedProcedure } from "~/server/trpc";
import { MAX_DEPOSIT_CENTAVOS } from "./deposit.rules";
import { deposit } from "./deposit.service";

export const depositRouter = createTRPCRouter({
	create: protectedProcedure
		.input(z.object({ amount: centavos.max(MAX_DEPOSIT_CENTAVOS) }))
		.mutation(({ ctx, input }) => deposit(ctx.userId, input.amount)),
});
