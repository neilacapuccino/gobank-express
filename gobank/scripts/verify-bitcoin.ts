// Run with: node --conditions=react-server --import tsx scripts/verify-bitcoin.ts
// Uses only temporary test users; their accounts and trades are deleted afterward.
import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { db } from "../src/server/db";
import {
  getBitcoinPortfolio,
  tradeBitcoin,
} from "../src/features/bitcoin/bitcoin.service";
import {
  getBitcoinChart,
  getBitcoinQuote,
} from "../src/features/bitcoin/bitcoin.market";

const suffix = randomUUID().replaceAll("-", "");
const ids: string[] = [];
try {
  const quote = await getBitcoinQuote();
  assert.ok(quote.priceCents > 0);
  for (const range of ["1H", "1D", "1W", "1M", "3M"] as const) {
    const chart = await getBitcoinChart(range);
    assert.ok(chart.length >= 2);
    assert.ok(
      chart.every((point, i) => i === 0 || point.time > chart[i - 1]!.time),
    );
  }
  for (let i = 0; i < 2; i++) {
    const user = await db.user.create({
      data: {
        username: `btc_test_${suffix}_${i}`,
        accountNumber: `btc-test-${suffix}-${i}`,
        pinHash: "test-only-not-a-valid-pin",
      },
    });
    ids.push(user.id);
    await getBitcoinPortfolio(user.id);
  }
  const userId = ids[0]!;
  const requestId = randomUUID();
  const [first, repeated] = await Promise.all([
    tradeBitcoin(userId, requestId, { side: "buy", cashCents: 10_000 }),
    tradeBitcoin(userId, requestId, { side: "buy", cashCents: 10_000 }),
  ]);
  assert.equal(first.id, repeated.id);
  assert.equal(
    await db.bitcoinOrder.count({ where: { accountId: userId } }),
    1,
  );
  assert.equal(
    (await getBitcoinPortfolio(userId)).cashCents,
    1_000_000 - first.cashCents,
  );
  await assert.rejects(
    tradeBitcoin(userId, randomUUID(), { side: "buy", cashCents: 1_000_000 }),
  );
  await assert.rejects(
    tradeBitcoin(ids[1]!, randomUUID(), {
      side: "sell",
      satoshis: first.satoshis,
    }),
  );
  await tradeBitcoin(userId, randomUUID(), {
    side: "sell",
    satoshis: first.satoshis,
  });
  const sold = await getBitcoinPortfolio(userId);
  assert.equal(sold.satoshis, 0n);
  assert.equal(sold.costBasisCents, 0);
  assert.equal(sold.orders.length, 2);
  assert.equal(
    (await db.user.findUniqueOrThrow({ where: { id: userId } })).balance,
    0,
  );
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
  console.log(
    "Bitcoin integration passed: live quotes, all chart ranges, persisted buy/sell, idempotency, concurrent balance protection, user isolation, unchanged peso wallet.",
  );
} finally {
  if (ids.length) await db.user.deleteMany({ where: { id: { in: ids } } });
  await db.$disconnect();
}
