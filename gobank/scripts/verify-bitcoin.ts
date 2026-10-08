// Temporary users exercise settlement without moving anyone else's money.
import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { db } from "../src/server/db";
import { post } from "../src/server/ledger";
import {
	getBitcoinPortfolio,
	tradeBitcoin,
} from "../src/features/bitcoin/bitcoin.service";
import {
	getBitcoinChart,
	getBitcoinQuote,
} from "../src/features/bitcoin/bitcoin.market";
import {
	BITCOIN_RANGES,
	BITCOIN_FEE_CENTAVOS,
	quoteIsFresh,
	SATOSHIS,
} from "../src/features/bitcoin/bitcoin.types";
const suffix = randomUUID().replaceAll("-", "");
const ids: string[] = [];
try {
	const quote = await getBitcoinQuote();
	assert.ok(quote.priceCentavos > 0 && quote.phpPerQuote > 1);
	assert.ok(quoteIsFresh(quote.asOf, Date.now()));
	const response = await fetch(
		"https://data-api.binance.vision/api/v3/ticker/24hr?symbol=BTCUSDT",
		{ signal: AbortSignal.timeout(8_000) },
	);
	const source = (await response.json()) as { lastPrice: string };
	const phpExpected = Number(source.lastPrice) * quote.phpPerQuote * 100;
	assert.ok(
		Math.abs(quote.priceCentavos - phpExpected) / phpExpected < 0.01,
		"PHP quote must convert USDT feed values",
	);
	for (const range of BITCOIN_RANGES) {
		const chart = await getBitcoinChart(range);
		assert.ok(chart.length >= 2);
		assert.ok(
			chart.every((point, i) => i === 0 || point.time > chart[i - 1]!.time),
		);
	}
	for (let i = 0; i < 3; i++) {
		const user = await db.user.create({
			data: {
				username: `btc_test_${suffix}_${i}`,
				fullName: "Bitcoin Test",
				accountNumber: `btc-test-${suffix}-${i}`,
				pinHash: "test-only-not-a-valid-pin",
			},
		});
		ids.push(user.id);
		const empty = await getBitcoinPortfolio(user.id);
		assert.equal(empty.cashCentavos, 0);
		assert.equal(empty.satoshis, 0n);
		assert.equal(empty.trades.length, 0);
		await assert.rejects(
			tradeBitcoin(user.id, randomUUID(), { side: "buy", cashCentavos: 100 }),
		);
		await db.$transaction((tx) =>
			post(tx, {
				userId: user.id,
				kind: "deposit",
				title: "Integration test funding",
				amount: 1_000_000,
			}),
		);
	}
	const userId = ids[0]!;
	const requestId = randomUUID();
	const [first, repeated] = await Promise.all([
		tradeBitcoin(userId, requestId, { side: "buy", cashCentavos: 10_000 }),
		tradeBitcoin(userId, requestId, { side: "buy", cashCentavos: 10_000 }),
	]);
	assert.equal(first.id, repeated.id);
	assert.equal(
		first.phpCentavos,
		Number(
			(first.satoshis * BigInt(first.priceCentavos) + SATOSHIS - 1n) / SATOSHIS,
		) + BITCOIN_FEE_CENTAVOS,
	);
	assert.equal(await db.bitcoinTrade.count({ where: { userId: userId } }), 1);
	const bought = await getBitcoinPortfolio(userId);
	assert.equal(bought.cashCentavos, 1_000_000 - first.phpCentavos);
	assert.ok(first.reference);
	const debit = await db.transaction.findUniqueOrThrow({
		where: { reference_userId: { reference: first.reference, userId } },
	});
	assert.equal(debit.amount, -first.phpCentavos);
	assert.equal(debit.balanceAfter, bought.cashCentavos);
	assert.equal(debit.points, 0);
	assert.equal(
		(debit.details as { feeCentavos: number }).feeCentavos,
		BITCOIN_FEE_CENTAVOS,
	);
	await assert.rejects(
		tradeBitcoin(userId, randomUUID(), {
			side: "buy",
			cashCentavos: 1_000_000,
		}),
	);
	await assert.rejects(
		tradeBitcoin(ids[1]!, randomUUID(), {
			side: "sell",
			satoshis: first.satoshis,
		}),
	);
	const sale = await tradeBitcoin(userId, randomUUID(), {
		side: "sell",
		satoshis: first.satoshis,
	});
	const sold = await getBitcoinPortfolio(userId);
	assert.equal(
		sale.phpCentavos,
		Number((sale.satoshis * BigInt(sale.priceCentavos)) / SATOSHIS) -
			BITCOIN_FEE_CENTAVOS,
	);
	assert.equal(sold.cashCentavos, bought.cashCentavos + sale.phpCentavos);
	assert.equal(sold.satoshis, 0n);
	assert.equal(sold.costBasisCentavos, 0);
	assert.equal(sold.trades.length, 2);
	assert.ok(sale.reference);
	assert.equal(
		(
			await db.transaction.findUniqueOrThrow({
				where: { reference_userId: { reference: sale.reference, userId } },
			})
		).amount,
		sale.phpCentavos,
	);
	const entryCount = await db.transaction.count({ where: { userId } });
	await assert.rejects(
		tradeBitcoin(userId, randomUUID(), {
			side: "buy",
			cashCentavos: sold.cashCentavos + 100,
		}),
	);
	assert.equal(
		(await getBitcoinPortfolio(userId)).cashCentavos,
		sold.cashCentavos,
	);
	assert.equal(await db.transaction.count({ where: { userId } }), entryCount);
	const raceId = ids[1]!;
	const fullBudget = 1_000_000 - BITCOIN_FEE_CENTAVOS;
	const race = await Promise.allSettled([
		tradeBitcoin(raceId, randomUUID(), {
			side: "buy",
			cashCentavos: fullBudget,
		}),
		tradeBitcoin(raceId, randomUUID(), {
			side: "buy",
			cashCentavos: fullBudget,
		}),
	]);
	assert.equal(
		race.filter((result) => result.status === "fulfilled").length,
		1,
	);
	assert.ok((await getBitcoinPortfolio(raceId)).cashCentavos >= 0);
	assert.equal(await db.bitcoinTrade.count({ where: { userId: raceId } }), 1);
	const mixedId = ids[2]!;
	const mixed = await Promise.allSettled([
		tradeBitcoin(mixedId, randomUUID(), {
			side: "buy",
			cashCentavos: fullBudget,
		}),
		db.$transaction((tx) =>
			post(tx, {
				userId: mixedId,
				kind: "transfer",
				title: "Competing test account spending",
				amount: -1_000_000,
			}),
		),
	]);
	assert.equal(
		mixed.filter((result) => result.status === "fulfilled").length,
		1,
	);
	assert.ok((await getBitcoinPortfolio(mixedId)).cashCentavos >= 0);
	console.log(
		"Integration passed: converted PHP quotes, all five ranges, fixed buy/sell fees, direct bank debit/credit, trade persistence, matching activity references, idempotency, concurrent trades/account spending, rollback, user isolation, and no rewards.",
	);
} finally {
	if (ids.length) await db.user.deleteMany({ where: { id: { in: ids } } });
	await db.$disconnect();
}
