import { MAX_CENTS, SATOSHIS } from "./bitcoin.types";

export type PracticeAccount = {
  cashCents: number;
  satoshis: bigint;
  costBasisCents: number;
  realizedCents: number;
};
export type BitcoinTrade =
  { side: "buy"; cashCents: number } | { side: "sell"; satoshis: bigint };

// Integer cents and satoshis avoid floating-point balance drift.
export function calculateTrade(
  account: PracticeAccount,
  trade: BitcoinTrade,
  priceCents: number,
) {
  if (
    !Number.isSafeInteger(priceCents) ||
    priceCents <= 0 ||
    priceCents > MAX_CENTS
  )
    throw new Error("Price is unavailable. Try again.");
  const price = BigInt(priceCents);
  let satoshis: bigint;
  let cashCents: number;
  let basis = 0;
  if (trade.side === "buy") {
    if (
      !Number.isSafeInteger(trade.cashCents) ||
      trade.cashCents < 100 ||
      trade.cashCents > MAX_CENTS
    )
      throw new Error("Enter at least 1.00 USDT.");
    if (trade.cashCents > account.cashCents)
      throw new Error("Not enough practice cash.");
    satoshis = (BigInt(trade.cashCents) * SATOSHIS) / price;
    if (satoshis === 0n)
      throw new Error("This amount is too small to buy Bitcoin.");
    // Round purchase costs up and sale proceeds down, preventing rounding profits.
    cashCents = Number((satoshis * price + SATOSHIS - 1n) / SATOSHIS);
    basis = -cashCents;
  } else {
    satoshis = trade.satoshis;
    if (satoshis <= 0n)
      throw new Error("Enter a Bitcoin amount greater than zero.");
    if (satoshis > account.satoshis)
      throw new Error("Not enough Bitcoin to sell.");
    cashCents = Number((satoshis * price) / SATOSHIS);
    if (cashCents === 0)
      throw new Error("This amount is worth less than 0.01 USDT.");
    basis = Number(
      (BigInt(account.costBasisCents) * satoshis) / account.satoshis,
    );
  }
  const realizedCents = trade.side === "sell" ? cashCents - basis : 0;
  const next = {
    cashCents:
      account.cashCents + (trade.side === "buy" ? -cashCents : cashCents),
    satoshis: account.satoshis + (trade.side === "buy" ? satoshis : -satoshis),
    costBasisCents: account.costBasisCents - basis,
    realizedCents: account.realizedCents + realizedCents,
  };
  if (
    [next.cashCents, next.costBasisCents, next.realizedCents, cashCents].some(
      (value) => !Number.isSafeInteger(value) || Math.abs(value) > MAX_CENTS,
    )
  )
    throw new Error("This trade exceeds the practice account limit.");
  return { next, satoshis, cashCents, realizedCents };
}
