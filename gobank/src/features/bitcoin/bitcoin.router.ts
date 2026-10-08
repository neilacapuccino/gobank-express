import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/trpc";
import { getBitcoinChart, getBitcoinQuote } from "./bitcoin.market";
import { getBitcoinPortfolio, tradeBitcoin } from "./bitcoin.service";
import { BITCOIN_RANGES, MAX_CENTAVOS } from "./bitcoin.types";

const requestId = z.string().uuid();
const trade = z.discriminatedUnion("side", [
	z.object({
		requestId,
		side: z.literal("buy"),
		cashCentavos: z.number().int().min(100).max(MAX_CENTAVOS),
	}),
	z.object({
		requestId,
		side: z.literal("sell"),
		satoshis: z
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
			tradeBitcoin(ctx.userId, input.requestId, input),
		),
});
