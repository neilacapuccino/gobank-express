import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/trpc";
import { getBitcoinChart, getBitcoinQuote } from "./bitcoin.market";
import { getBitcoinPortfolio, tradeBitcoin } from "./bitcoin.service";
import { BITCOIN_RANGES, MAX_CENTAVOS } from "./bitcoin.types";

const submissionId = z.string().uuid();
const trade = z.discriminatedUnion("action", [
	z.object({
		submissionId,
		action: z.literal("buy"),
		cashCentavos: z.number().int().min(100).max(MAX_CENTAVOS),
	}),
	z.object({
		submissionId,
		action: z.literal("sell"),
		bitcoinUnits: z
			.string()
			.regex(/^[1-9]\d{0,17}$/)
			.transform(BigInt),
	}),
]);

export const bitcoinRouter = createTRPCRouter({
	quote: protectedProcedure.query(() => getBitcoinQuote()),
	chart: protectedProcedure
		.input(z.object({ range: z.enum(BITCOIN_RANGES) }))
		.query(({ input }) => getBitcoinChart(input.range)),
	portfolio: protectedProcedure.query(({ ctx }) =>
		getBitcoinPortfolio(ctx.userId),
	),
	trade: protectedProcedure
		.input(trade)
		.mutation(({ ctx, input }) =>
			tradeBitcoin(ctx.userId, input.submissionId, input),
		),
});
