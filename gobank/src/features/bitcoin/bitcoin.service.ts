import { db } from "~/server/db";
import { asDatabaseError, fail } from "~/server/errors";
import { getBitcoinQuote } from "./bitcoin.market";
import { calculateTrade, type BitcoinTrade } from "./bitcoin.rules";
import { quoteIsFresh } from "./bitcoin.types";

export async function getBitcoinPortfolio(userId: string) {
  const account = await db.bitcoinAccount.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
  const orders = await db.bitcoinOrder.findMany({
    where: { accountId: userId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 20,
  });
  return { ...account, orders };
}

export async function tradeBitcoin(
  userId: string,
  requestId: string,
  trade: BitcoinTrade,
) {
  const duplicate = await db.bitcoinOrder.findUnique({
    where: { accountId_requestId: { accountId: userId, requestId } },
  });
  if (duplicate) return duplicate;
  const quote = await getBitcoinQuote();
  // Never execute from a browser-supplied price or an expired market snapshot.
  if (!quoteIsFresh(quote.asOf, Date.now()))
    fail("BAD_REQUEST", "The quote expired. Refresh the price and try again.");
  await db.bitcoinAccount.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      return await db.$transaction(
        async (tx) => {
          const repeated = await tx.bitcoinOrder.findUnique({
            where: { accountId_requestId: { accountId: userId, requestId } },
          });
          if (repeated) return repeated;
          if (!quoteIsFresh(quote.asOf, Date.now()))
            fail("BAD_REQUEST", "The quote expired. Try again.");
          const account = await tx.bitcoinAccount.findUniqueOrThrow({
            where: { userId },
          });
          let result;
          try {
            result = calculateTrade(account, trade, quote.priceCents);
          } catch (error) {
            return fail(
              "BAD_REQUEST",
              error instanceof Error
                ? error.message
                : "This trade could not be completed.",
            );
          }
          await tx.bitcoinAccount.update({
            where: { userId, version: account.version },
            data: { ...result.next, version: { increment: 1 } },
          });
          return tx.bitcoinOrder.create({
            data: {
              accountId: userId,
              requestId,
              side: trade.side,
              satoshis: result.satoshis,
              cashCents: result.cashCents,
              priceCents: quote.priceCents,
              realizedCents: result.realizedCents,
              cashAfter: result.next.cashCents,
              satoshisAfter: result.next.satoshis,
              quotedAt: new Date(quote.asOf),
            },
          });
        },
        { isolationLevel: "Serializable" },
      );
    } catch (error) {
      const code = asDatabaseError(error)?.code;
      if (code === "P2002") {
        const repeated = await db.bitcoinOrder.findUnique({
          where: { accountId_requestId: { accountId: userId, requestId } },
        });
        if (repeated) return repeated;
      }
      if (code !== "P2034" && code !== "P2025") throw error;
      if (attempt === 3)
        fail("CONFLICT", "Your portfolio changed. Please try again.");
    }
  }
  return fail("CONFLICT", "Please try this trade again.");
}
