import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { db } from "../src/server/db";
import { newAccountNumber } from "../src/server/identifiers";
import { deposit } from "../src/features/deposit/deposit.service";
import {
	getBitcoinPortfolio,
	tradeBitcoin,
} from "../src/features/bitcoin/bitcoin.service";
import {
	getBitcoinChart,
	getBitcoinQuote,
} from "../src/features/bitcoin/bitcoin-market.server";
import {
	BITCOIN_FEE_CENTAVOS,
	quoteIsFresh,
	UNITS_PER_BITCOIN,
} from "../src/features/bitcoin/bitcoin.types";

const STARTING_CASH = 1_000_000;

type SavedTrade = { bitcoinUnits: bigint; unitPriceCentavos: number };

const tradeValue = ({ bitcoinUnits, unitPriceCentavos }: SavedTrade) =>
	bitcoinUnits * BigInt(unitPriceCentavos);

const expectedBuyCost = (trade: SavedTrade) =>
	Number((tradeValue(trade) + UNITS_PER_BITCOIN - 1n) / UNITS_PER_BITCOIN) +
	BITCOIN_FEE_CENTAVOS;

const expectedSaleProceeds = (trade: SavedTrade) =>
	Number(tradeValue(trade) / UNITS_PER_BITCOIN) - BITCOIN_FEE_CENTAVOS;

const transactionCount = (userId: string) =>
	db.transaction.count({ where: { userId } });

async function createFundedUser() {
	const user = await db.user.create({
		data: {
			username: `btc_${randomUUID().replaceAll("-", "").slice(0, 12)}`,
			fullName: "Bitcoin fixture",
			accountNumber: newAccountNumber(),
			pinHash: "fixture-only",
		},
		select: { id: true },
	});

	await deposit(user.id, STARTING_CASH);
	return user.id;
}

let userId: string | undefined;

try {
	const quote = await getBitcoinQuote();
	assert.ok(quote.unitPriceCentavos > 0 && quote.phpPerQuote > 1);
	assert.ok(quoteIsFresh(quote.asOf, Date.now()));
	assert.ok((await getBitcoinChart("1H")).length >= 2);

	userId = await createFundedUser();

	const submissionId = randomUUID();
	const order = { action: "buy" as const, cashCentavos: 10_000 };
	const buy = await tradeBitcoin(userId, submissionId, order);
	const repeated = await tradeBitcoin(userId, submissionId, order);

	assert.equal(repeated.id, buy.id);
	assert.equal(buy.amountCentavos, expectedBuyCost(buy));

	const afterBuy = await getBitcoinPortfolio(userId);
	assert.equal(afterBuy.trades.length, 1);
	assert.equal(afterBuy.cashCentavos, STARTING_CASH - buy.amountCentavos);

	const entriesBefore = await transactionCount(userId);
	await assert.rejects(
		tradeBitcoin(userId, randomUUID(), {
			action: "buy",
			cashCentavos: afterBuy.cashCentavos + 100,
		}),
	);
	assert.equal(
		(await getBitcoinPortfolio(userId)).cashCentavos,
		afterBuy.cashCentavos,
	);
	assert.equal(await transactionCount(userId), entriesBefore);

	const sale = await tradeBitcoin(userId, randomUUID(), {
		action: "sell",
		bitcoinUnits: buy.bitcoinUnits,
	});
	assert.equal(sale.amountCentavos, expectedSaleProceeds(sale));

	const afterSale = await getBitcoinPortfolio(userId);
	assert.equal(afterSale.bitcoinUnits, 0n);
	assert.equal(
		afterSale.cashCentavos,
		afterBuy.cashCentavos + sale.amountCentavos,
	);

	console.log(
		"Passed: live Bitcoin quote, chart, fees, idempotency, settlement and rollback.",
	);
} finally {
	try {
		if (userId) await db.user.deleteMany({ where: { id: userId } });
	} finally {
		await db.$disconnect();
	}
}
