import { db } from "~/server/db";
import { newReference } from "~/server/codes";
import { asDatabaseError, fail } from "~/server/errors";
import { post } from "~/server/ledger";
import { getBitcoinQuote } from "./bitcoin.market";
import { calculateTrade, type BitcoinTrade } from "./bitcoin.rules";
import { quoteIsFresh } from "./bitcoin.types";

async function ensureWallet(userId: string) {
  try {
    await db.investmentWallet.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
  } catch (error) {
    if (asDatabaseError(error)?.code !== "P2002") throw error;
    await db.investmentWallet.findUniqueOrThrow({ where: { userId } });
  }
}

export async function getBitcoinPortfolio(userId: string) {
  await ensureWallet(userId);
  return db.$transaction(
    async (tx) => {
      const account = await tx.investmentWallet.findUniqueOrThrow({
        where: { userId },
      });
      const user = await tx.user.findUniqueOrThrow({
        where: { id: userId },
        select: { balance: true },
      });
      const orders = await tx.investmentOrder.findMany({
        where: { accountId: userId },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 20,
      });
      return {
        satoshis: account.satoshis,
        costBasisCents: account.costBasisCents,
        realizedCents: account.realizedCents,
        cashCents: user.balance,
        orders,
      };
    },
    { isolationLevel: "RepeatableRead" },
  );
}

export async function tradeBitcoin(
  userId: string,
  requestId: string,
  trade: BitcoinTrade,
) {
  const duplicate = await db.investmentOrder.findUnique({
    where: { accountId_requestId: { accountId: userId, requestId } },
  });
  if (duplicate) return duplicate;
  const quote = await getBitcoinQuote();
  // Never execute from a browser-supplied price or an expired market snapshot.
  if (!quoteIsFresh(quote.asOf, Date.now()))
    fail("BAD_REQUEST", "The quote expired. Refresh the price and try again.");
  await ensureWallet(userId);
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      return await db.$transaction(
        async (tx) => {
          const repeated = await tx.investmentOrder.findUnique({
            where: { accountId_requestId: { accountId: userId, requestId } },
          });
          if (repeated) return repeated;
          if (!quoteIsFresh(quote.asOf, Date.now()))
            fail("BAD_REQUEST", "The quote expired. Try again.");
          const account = await tx.investmentWallet.findUniqueOrThrow({
            where: { userId },
          });
          let result;
          try {
            const user = await tx.user.findUniqueOrThrow({
              where: { id: userId },
              select: { balance: true },
            });
            result = calculateTrade(
              { ...account, cashCents: user.balance },
              trade,
              quote.priceCents,
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
            title: trade.side === "buy" ? "Bought Bitcoin" : "Sold Bitcoin",
            amount: trade.side === "buy" ? -result.cashCents : result.cashCents,
            reference,
            details: {
              satoshis: result.satoshis.toString(),
              priceCentavos: quote.priceCents,
            },
          });
          await tx.investmentWallet.update({
            where: { userId, version: account.version },
            data: {
              satoshis: result.next.satoshis,
              costBasisCents: result.next.costBasisCents,
              realizedCents: result.next.realizedCents,
              version: { increment: 1 },
            },
          });
          return tx.investmentOrder.create({
            data: {
              accountId: userId,
              requestId,
              reference,
              side: trade.side,
              satoshis: result.satoshis,
              cashCents: result.cashCents,
              priceCents: quote.priceCents,
              realizedCents: result.realizedCents,
              phpAfter: result.next.cashCents,
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
        const repeated = await db.investmentOrder.findUnique({
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
