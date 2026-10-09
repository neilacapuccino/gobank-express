import { db } from "~/server/db";
import { newReference } from "~/server/codes";
import { asDatabaseError, fail } from "~/server/errors";
import { post } from "~/server/ledger";
import { getBitcoinQuote } from "./bitcoin.market";
import {
	calculateTrade,
	summarizeTrades,
	type BitcoinTrade,
} from "./bitcoin.rules";
import { quoteIsFresh } from "./bitcoin.types";

export async function getBitcoinPortfolio(userId: string) {
	return db.$transaction(
		async (tx) => {
			const user = await tx.user.findUniqueOrThrow({
				where: { id: userId },
				select: { balance: true },
			});
			const trades = await tx.bitcoinTrade.findMany({
				where: { userId },
				orderBy: [{ createdAt: "asc" }, { id: "asc" }],
			});
			return {
				...summarizeTrades(trades),
				cashCentavos: user.balance,
				trades: trades.slice(-20).reverse(),
			};
		},
		{ isolationLevel: "RepeatableRead" },
	);
}

export async function tradeBitcoin(
	userId: string,
	submissionId: string,
	trade: BitcoinTrade,
) {
	const key = {
		userId_submissionId: {
			userId,
			submissionId,
		},
	};
	const duplicate = await db.bitcoinTrade.findUnique({ where: key });
	if (duplicate) return duplicate;
	const quote = await getBitcoinQuote();

	// Only server prices can settle a trade. Serialization prevents double spending.
	for (let attempt = 0; attempt < 4; attempt++) {
		try {
			return await db.$transaction(
				async (tx) => {
					const repeated = await tx.bitcoinTrade.findUnique({ where: key });
					if (repeated) return repeated;
					if (!quoteIsFresh(quote.asOf, Date.now()))
						fail(
							"BAD_REQUEST",
							"The quote expired. Refresh the price and try again.",
						);

					const user = await tx.user.findUniqueOrThrow({
						where: { id: userId },
						select: { balance: true },
					});
					const history = await tx.bitcoinTrade.findMany({
						where: { userId },
						orderBy: [{ createdAt: "asc" }, { id: "asc" }],
					});
					let result;
					try {
						result = calculateTrade(
							{
								...summarizeTrades(history),
								cashCentavos: user.balance,
							},
							trade,
							quote.unitPriceCentavos,
						);
					} catch (error) {
						return fail(
							"BAD_REQUEST",
							error instanceof Error
								? error.message
								: "This trade could not be completed.",
						);
					}
					const reference = newReference();
					await post(tx, {
						userId,
						kind: "exchange",
						title: trade.action === "buy" ? "Bought Bitcoin" : "Sold Bitcoin",
						amount:
							trade.action === "buy"
								? -result.cashCentavos
								: result.cashCentavos,
						reference,
						details: {
							satoshis: result.bitcoinUnits.toString(),
							priceCentavos: quote.unitPriceCentavos,
							feeCentavos: result.feeCentavos,
						},
					});
					return tx.bitcoinTrade.create({
						data: {
							userId,
							submissionId,
							reference,
							action: trade.action,
							bitcoinUnits: result.bitcoinUnits,
							amountCentavos: result.cashCentavos,
							unitPriceCentavos: quote.unitPriceCentavos,
						},
					});
				},
				{ isolationLevel: "Serializable" },
			);
		} catch (error) {
			const code = asDatabaseError(error)?.code;
			if (code === "P2002") {
				const repeated = await db.bitcoinTrade.findUnique({ where: key });
				if (repeated) return repeated;
			}
			if (code !== "P2034") throw error;
		}
	}
	return fail("CONFLICT", "Your account changed. Please try this trade again.");
}
