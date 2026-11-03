import { db } from "~/server/db";
import { newReference } from "~/server/identifiers";
import { asDatabaseError, fail } from "~/server/errors";
import { post } from "~/server/ledger";
import type { Prisma } from "../../../generated/prisma";
import { getBitcoinQuote } from "./bitcoin-market.server";
import {
	calculateTrade,
	summarizeTrades,
	type BitcoinTrade,
} from "./bitcoin.rules";
import { quoteIsFresh } from "./bitcoin.types";

type Quote = Awaited<ReturnType<typeof getBitcoinQuote>>;

const MAX_ATTEMPTS = 4;

const tradeKey = (userId: string, submissionId: string) => ({
	userId_submissionId: { userId, submissionId },
});

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

function priceTrade(...input: Parameters<typeof calculateTrade>) {
	try {
		return calculateTrade(...input);
	} catch (error) {
		return fail(
			"BAD_REQUEST",
			error instanceof Error
				? error.message
				: "This trade could not be completed.",
		);
	}
}

async function recordTrade(
	tx: Prisma.TransactionClient,
	userId: string,
	submissionId: string,
	trade: BitcoinTrade,
	quote: Quote,
) {
	const repeated = await tx.bitcoinTrade.findUnique({
		where: tradeKey(userId, submissionId),
	});
	if (repeated) return repeated;

	if (!quoteIsFresh(quote.asOf, Date.now())) {
		fail("BAD_REQUEST", "The quote expired. Refresh the price and try again.");
	}

	const user = await tx.user.findUniqueOrThrow({
		where: { id: userId },
		select: { balance: true },
	});
	const history = await tx.bitcoinTrade.findMany({
		where: { userId },
		orderBy: [{ createdAt: "asc" }, { id: "asc" }],
	});

	const result = priceTrade(
		{ ...summarizeTrades(history), cashCentavos: user.balance },
		trade,
		quote.unitPriceCentavos,
	);
	const buying = trade.action === "buy";
	const reference = newReference();

	await post(tx, {
		userId,
		kind: "exchange",
		title: buying ? "Bitcoin purchase" : "Bitcoin sale",
		amount: buying ? -result.cashCentavos : result.cashCentavos,
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
}

export async function tradeBitcoin(
	userId: string,
	submissionId: string,
	trade: BitcoinTrade,
) {
	const key = tradeKey(userId, submissionId);

	const duplicate = await db.bitcoinTrade.findUnique({ where: key });
	if (duplicate) return duplicate;

	const quote = await getBitcoinQuote();

	for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
		try {
			return await db.$transaction(
				(tx) => recordTrade(tx, userId, submissionId, trade, quote),
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
