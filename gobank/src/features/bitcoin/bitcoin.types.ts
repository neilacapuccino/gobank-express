export const BITCOIN_RANGES = ["1H", "1D", "1W", "1M", "3M"] as const;
export type BitcoinRange = (typeof BITCOIN_RANGES)[number];
export type BitcoinQuote = {
  priceCents: number;
  openCents: number;
  highCents: number;
  lowCents: number;
  volume: number;
  asOf: number;
};
export type BitcoinCandle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};
export const SATOSHIS = 100_000_000n;
export const STARTING_CASH = 1_000_000;
export const MAX_CENTS = 2_000_000_000;

export const quoteIsFresh = (asOf: number, now: number) =>
  Number.isFinite(asOf) && now - asOf < 60_000 && asOf - now < 10_000;

export const usdt = (cents: number) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);

export const btc = (satoshis: bigint) =>
  `${satoshis / SATOSHIS}.${(satoshis % SATOSHIS).toString().padStart(8, "0")}`;

export const holdingValue = (satoshis: bigint, priceCents: number) =>
  Number((satoshis * BigInt(priceCents)) / SATOSHIS);

export function parseUnits(value: string, decimals: number): bigint | null {
  const match = /^(\d+)(?:\.(\d*))?$/.exec(value.trim());
  if (!match || (match[2]?.length ?? 0) > decimals || value.length > 24)
    return null;
  return (
    BigInt(match[1]!) * 10n ** BigInt(decimals) +
    BigInt((match[2] ?? "").padEnd(decimals, "0") || "0")
  );
}
