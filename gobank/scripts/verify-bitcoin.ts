// Optional network check: live market data and one temporary user's trades.
import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { db } from "../src/server/db";
import { newAccountNumber } from "../src/server/codes";
import { deposit } from "../src/features/deposit/deposit.service";
import {
	getBitcoinPortfolio,
	tradeBitcoin,
} from "../src/features/bitcoin/bitcoin.service";
import {
	getBitcoinChart,
	getBitcoinQuote,
} from "../src/features/bitcoin/bitcoin.market";
import {
	BITCOIN_FEE_CENTAVOS,
	quoteIsFresh,
	UNITS_PER_BITCOIN,
} from "../src/features/bitcoin/bitcoin.types";

let userId: string | undefined;
try {
	const quote = await getBitcoinQuote();
	assert.ok(quote.unitPriceCentavos > 0 && quote.phpPerQuote > 1);
	assert.ok(quoteIsFresh(quote.asOf, Date.now()));
	assert.ok((await getBitcoinChart("1H")).length >= 2);
	const user = await db.user.create({
		data: {
			username: `btc_${randomUUID().replaceAll("-", "").slice(0, 12)}`,
			fullName: "Bitcoin fixture",
			accountNumber: newAccountNumber(),
			pinHash: "fixture-only",
		},
		select: { id: true },
	});
	userId = user.id;
	await deposit(user.id, 1_000_000);
	const submissionId = randomUUID();
	const buy = await tradeBitcoin(user.id, submissionId, {
		action: "buy",
		cashCentavos: 10_000,
	});
	const repeated = await tradeBitcoin(user.id, submissionId, {
		action: "buy",
		cashCentavos: 10_000,
	});
	assert.equal(repeated.id, buy.id);
	assert.equal(
		buy.amountCentavos,
		Number(
			(buy.bitcoinUnits * BigInt(buy.unitPriceCentavos) +
				UNITS_PER_BITCOIN -
				1n) /
				UNITS_PER_BITCOIN,
		) + BITCOIN_FEE_CENTAVOS,
	);
	const bought = await getBitcoinPortfolio(user.id);
	assert.equal(bought.trades.length, 1);
	assert.equal(bought.cashCentavos, 1_000_000 - buy.amountCentavos);
	const entryCount = await db.transaction.count({ where: { userId: user.id } });
	await assert.rejects(
		tradeBitcoin(user.id, randomUUID(), {
			action: "buy",
			cashCentavos: bought.cashCentavos + 100,
		}),
	);
	assert.equal(
		(await getBitcoinPortfolio(user.id)).cashCentavos,
		bought.cashCentavos,
	);
	assert.equal(
		await db.transaction.count({ where: { userId: user.id } }),
		entryCount,
	);
	const sale = await tradeBitcoin(user.id, randomUUID(), {
		action: "sell",
		bitcoinUnits: buy.bitcoinUnits,
	});
	assert.equal(
		sale.amountCentavos,
		Number(
			(sale.bitcoinUnits * BigInt(sale.unitPriceCentavos)) / UNITS_PER_BITCOIN,
		) - BITCOIN_FEE_CENTAVOS,
	);
	const sold = await getBitcoinPortfolio(user.id);
	assert.equal(sold.bitcoinUnits, 0n);
	assert.equal(sold.cashCentavos, bought.cashCentavos + sale.amountCentavos);
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
