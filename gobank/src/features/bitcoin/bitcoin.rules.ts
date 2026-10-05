import { MAX_CENTS, SATOSHIS } from "./bitcoin.types";

export type TradingBalances = {
  cashCents: number;
  satoshis: bigint;
  costBasisCents: number;
  realizedCents: number;
};
export type BitcoinTrade =
  { side: "buy"; cashCents: number } | { side: "sell"; satoshis: bigint };

type Holdings = Omit<TradingBalances, "cashCents">;
type SettledTrade = { side: string; satoshis: bigint; phpCentavos: number };

function applyTrade(holdings: Holdings, trade: SettledTrade): Holdings {
  if (trade.side !== "buy" && trade.side !== "sell")
    throw new Error("Unknown Bitcoin trade type.");
  if (
    trade.satoshis <= 0n ||
    !Number.isSafeInteger(trade.phpCentavos) ||
    trade.phpCentavos <= 0
  )
    throw new Error("Invalid Bitcoin trade amount.");
  if (trade.side === "sell" && trade.satoshis > holdings.satoshis)
    throw new Error("Not enough Bitcoin to sell.");

  const buy = trade.side === "buy";
  const basis = buy
    ? -trade.phpCentavos
    : Number(
        (BigInt(holdings.costBasisCents) * trade.satoshis) / holdings.satoshis,
      );
  return {
    satoshis: holdings.satoshis + (buy ? trade.satoshis : -trade.satoshis),
    costBasisCents: holdings.costBasisCents - basis,
    realizedCents:
      holdings.realizedCents + (buy ? 0 : trade.phpCentavos - basis),
  };
}

// History must be in execution order. This calculation never changes its inputs.
export function summarizeTrades(trades: readonly SettledTrade[]): Holdings {
  return trades.reduce(applyTrade, {
    satoshis: 0n,
    costBasisCents: 0,
    realizedCents: 0,
  });
}

// Integer cents and satoshis avoid floating-point balance drift.
export function calculateTrade(
  account: TradingBalances,
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
  if (trade.side === "buy") {
    if (
      !Number.isSafeInteger(trade.cashCents) ||
      trade.cashCents < 100 ||
      trade.cashCents > MAX_CENTS
    )
      throw new Error("Enter at least ₱1.00.");
    if (trade.cashCents > account.cashCents)
      throw new Error("Not enough PHP in your account.");
    satoshis = (BigInt(trade.cashCents) * SATOSHIS) / price;
    if (satoshis === 0n)
      throw new Error("This amount is too small to buy Bitcoin.");
    // Round purchase costs up and sale proceeds down, preventing rounding profits.
    cashCents = Number((satoshis * price + SATOSHIS - 1n) / SATOSHIS);
  } else {
    satoshis = trade.satoshis;
    if (satoshis <= 0n)
      throw new Error("Enter a Bitcoin amount greater than zero.");
    if (satoshis > account.satoshis)
      throw new Error("Not enough Bitcoin to sell.");
    cashCents = Number((satoshis * price) / SATOSHIS);
    if (cashCents === 0)
      throw new Error("This amount is worth less than ₱0.01.");
  }
  const holdings = applyTrade(account, {
    side: trade.side,
    satoshis,
    phpCentavos: cashCents,
  });
  const realizedCents = holdings.realizedCents - account.realizedCents;
  const next = {
    cashCents:
      account.cashCents + (trade.side === "buy" ? -cashCents : cashCents),
    ...holdings,
  };
  if (
    [next.cashCents, next.costBasisCents, next.realizedCents, cashCents].some(
      (value) => !Number.isSafeInteger(value) || Math.abs(value) > MAX_CENTS,
    )
  )
    throw new Error("This trade exceeds the account limit.");
  return { next, satoshis, cashCents, realizedCents };
}
