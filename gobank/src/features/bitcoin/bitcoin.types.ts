export const BITCOIN_RANGES = ["1MIN", "1H", "1W", "1M", "1Y"] as const;
export type BitcoinRange = (typeof BITCOIN_RANGES)[number];
export const BITCOIN_CANDLES: Record<
  BitcoinRange,
  { interval: string; limit: number; label: string }
> = {
  "1MIN": {
    interval: "1s",
    limit: 60,
    label: "1-second candles · last 60 seconds",
  },
  "1H": { interval: "1m", limit: 60, label: "1-minute candles" },
  "1W": { interval: "1h", limit: 168, label: "1-hour candles" },
  "1M": { interval: "4h", limit: 180, label: "4-hour candles" },
  "1Y": { interval: "1d", limit: 365, label: "1-day candles" },
};
export type BitcoinQuote = {
  priceCents: number;
  openCents: number;
  highCents: number;
  lowCents: number;
  volume: number;
  asOf: number;
  phpPerQuote: number;
  rateDate: string;
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

export const MAX_CENTS = 2_000_000_000;

export const quoteIsFresh = (asOf: number, now: number) =>
  Number.isFinite(asOf) && now - asOf < 60_000 && asOf - now < 10_000;

export const money = (cents: number) =>
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
