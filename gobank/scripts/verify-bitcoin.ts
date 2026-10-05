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
  quoteIsFresh,
} from "../src/features/bitcoin/bitcoin.types";
const suffix = randomUUID().replaceAll("-", "");
const ids: string[] = [];
try {
  const quote = await getBitcoinQuote();
  assert.ok(quote.priceCents > 0 && quote.phpPerQuote > 1);
  assert.ok(quoteIsFresh(quote.asOf, Date.now()));
  const response = await fetch(
    "https://data-api.binance.vision/api/v3/ticker/24hr?symbol=BTCUSDT",
    { signal: AbortSignal.timeout(8_000) },
  );
  const source = (await response.json()) as { lastPrice: string };
  const phpExpected = Number(source.lastPrice) * quote.phpPerQuote * 100;
  assert.ok(
    Math.abs(quote.priceCents - phpExpected) / phpExpected < 0.01,
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
        accountNumber: `btc-test-${suffix}-${i}`,
        pinHash: "test-only-not-a-valid-pin",
      },
    });
    ids.push(user.id);
    const empty = await getBitcoinPortfolio(user.id);
    assert.equal(empty.cashCents, 0);
    assert.equal(empty.satoshis, 0n);
    assert.equal(empty.orders.length, 0);
    await assert.rejects(
      tradeBitcoin(user.id, randomUUID(), { side: "buy", cashCents: 100 }),
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
    tradeBitcoin(userId, requestId, { side: "buy", cashCents: 10_000 }),
    tradeBitcoin(userId, requestId, { side: "buy", cashCents: 10_000 }),
  ]);
  assert.equal(first.id, repeated.id);
  assert.equal(
    await db.investmentOrder.count({ where: { accountId: userId } }),
    1,
  );
  const bought = await getBitcoinPortfolio(userId);
  assert.equal(bought.cashCents, 1_000_000 - first.cashCents);
  assert.ok(first.reference);
  const debit = await db.transaction.findUniqueOrThrow({
    where: { reference_userId: { reference: first.reference, userId } },
  });
  assert.equal(debit.amount, -first.cashCents);
  assert.equal(debit.balanceAfter, bought.cashCents);
  assert.equal(debit.points, 0);
  await assert.rejects(
    tradeBitcoin(userId, randomUUID(), { side: "buy", cashCents: 1_000_000 }),
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
  assert.equal(sold.cashCents, bought.cashCents + sale.cashCents);
  assert.equal(sold.satoshis, 0n);
  assert.equal(sold.costBasisCents, 0);
  assert.equal(sold.orders.length, 2);
  assert.ok(sale.reference);
  assert.equal(
    (
      await db.transaction.findUniqueOrThrow({
        where: { reference_userId: { reference: sale.reference, userId } },
      })
    ).amount,
    sale.cashCents,
  );
  const entryCount = await db.transaction.count({ where: { userId } });
  await assert.rejects(
    tradeBitcoin(userId, randomUUID(), {
      side: "buy",
      cashCents: sold.cashCents + 100,
    }),
  );
  assert.equal((await getBitcoinPortfolio(userId)).cashCents, sold.cashCents);
  assert.equal(await db.transaction.count({ where: { userId } }), entryCount);
  const raceId = ids[1]!;
  const race = await Promise.allSettled([
    tradeBitcoin(raceId, randomUUID(), { side: "buy", cashCents: 1_000_000 }),
    tradeBitcoin(raceId, randomUUID(), { side: "buy", cashCents: 1_000_000 }),
  ]);
  assert.equal(
    race.filter((result) => result.status === "fulfilled").length,
    1,
  );
  assert.ok((await getBitcoinPortfolio(raceId)).cashCents >= 0);
  assert.equal(
    await db.investmentOrder.count({ where: { accountId: raceId } }),
    1,
  );
  const mixedId = ids[2]!;
  const mixed = await Promise.allSettled([
    tradeBitcoin(mixedId, randomUUID(), { side: "buy", cashCents: 1_000_000 }),
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
  assert.ok((await getBitcoinPortfolio(mixedId)).cashCents >= 0);
  console.log(
    "Integration passed: converted PHP quotes, all five ranges, direct bank debit/credit, trade persistence, matching activity references, idempotency, concurrent trades/account spending, rollback, user isolation, and no rewards.",
  );
} finally {
  if (ids.length) await db.user.deleteMany({ where: { id: { in: ids } } });
  await db.$disconnect();
}
