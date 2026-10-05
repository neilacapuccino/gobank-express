"use client";

import { useId, useState } from "react";
import { CandlestickChart, ChartNoAxesCombined, RefreshCw } from "lucide-react";
import { useBitcoinCandles } from "../hooks/use-bitcoin-candles";
import { groupCandles } from "../bitcoin.candles";
import {
  BITCOIN_RANGES,
  BITCOIN_CANDLES,
  money,
  type BitcoinCandle,
  type BitcoinRange,
  type BitcoinQuote,
} from "../bitcoin.types";

const W = 360,
  H = 216,
  LEFT = 12,
  RIGHT = 68,
  TOP = 16,
  BOTTOM = 26;

export function BitcoinChart({ quote }: { quote?: BitcoinQuote }) {
  const [range, setRange] = useState<BitcoinRange>("1H");
  const [mode, setMode] = useState<"line" | "candles">("candles");
  const [cursor, setCursor] = useState<number | null>(null);
  const id = useId().replaceAll(":", "");
  const { chart, points: history, updatedAt } = useBitcoinCandles(range);
  const candles = range === "1MIN" ? groupCandles(history, 3_000) : history;
  const points = quote
    ? candles.map((point) => ({
        ...point,
        open: point.open * quote.phpPerQuote,
        high: point.high * quote.phpPerQuote,
        low: point.low * quote.phpPerQuote,
        close: point.close * quote.phpPerQuote,
      }))
    : [];
  const first = points[0];
  const last = points.at(-1);
  const low = Math.min(
    ...points.map((p) => (mode === "candles" ? p.low : p.close)),
  );
  const high = Math.max(
    ...points.map((p) => (mode === "candles" ? p.high : p.close)),
  );
  const spread = Math.max(high - low, high * 0.00001, 0.01);
  const minimum = low - spread * 0.12;
  const maximum = high + spread * 0.12;
  const y = (value: number) =>
    TOP + ((maximum - value) / (maximum - minimum)) * (H - TOP - BOTTOM);
  // Time-based spacing preserves gaps in the exchange's candle history.
  const x = (point: BitcoinCandle) =>
    LEFT +
    ((point.time - (first?.time ?? 0)) /
      Math.max(1, (last?.time ?? 0) - (first?.time ?? 0))) *
      (W - LEFT - RIGHT);
  const path = points
    .map(
      (p, i) => `${i ? "L" : "M"}${x(p).toFixed(2)},${y(p.close).toFixed(2)}`,
    )
    .join(" ");
  const flatPath = points
    .slice(1)
    .map((point, index) => {
      const previous = points[index]!;
      if (Math.abs(y(point.open) - y(previous.close)) >= 1.5) return "";
      return `M${x(previous)},${y(previous.close)} L${x(point)},${y(point.open)}`;
    })
    .join(" ");
  const up = !!first && !!last && last.close >= first.close;
  const color = up ? "#56e3b1" : "#fb7185";
  const selected =
    cursor === null ? undefined : points[Math.min(cursor, points.length - 1)];
  const change =
    first && last ? ((last.close - first.open) / first.open) * 100 : null;
  const labelTime = (time: number) =>
    new Date(time).toLocaleString(
      "en-US",
      range === "1MIN" || range === "1H"
        ? {
            hour: "numeric",
            minute: "2-digit",
            ...(range === "1MIN" ? { second: "2-digit" } : {}),
          }
        : { month: "short", day: "numeric" },
    );
  const slot = (W - LEFT - RIGHT) / Math.max(points.length - 1, 1);
  const width = Math.min(12, Math.max(1, slot * 0.72));

  return (
    <section
      className="rounded-[24px] border border-white/[.07] bg-[#171719] p-4"
      aria-label="Bitcoin price chart"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-ink-muted text-[11px]">
          {change === null ? (
            "Price history"
          ) : (
            <>
              <span style={{ color }}>
                {change >= 0 ? "+" : ""}
                {change.toFixed(2)}%
              </span>{" "}
              <span className="ml-1">
                past{" "}
                {range === "1MIN"
                  ? "minute"
                  : range === "1H"
                    ? "hour"
                    : range === "1W"
                      ? "week"
                      : range === "1M"
                        ? "30 days"
                        : "year"}
              </span>
            </>
          )}
        </p>
        <div className="flex rounded-lg bg-white/[.04] p-0.5">
          {(["line", "candles"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-label={value === "line" ? "Line chart" : "Candlestick chart"}
              aria-pressed={mode === value}
              onClick={() => {
                setMode(value);
                setCursor(null);
              }}
              className={`grid h-8 w-8 place-items-center rounded-md ${mode === value ? "bg-white/10 text-white" : "text-ink-muted"}`}
            >
              {value === "line" ? (
                <ChartNoAxesCombined size={15} />
              ) : (
                <CandlestickChart size={15} />
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="mb-3 flex items-center justify-between gap-2 text-[9px]">
        <span className="text-ink-faint">
          {range === "1MIN"
            ? "3-second candles · last 60 seconds"
            : BITCOIN_CANDLES[range].label}
        </span>
      </div>
      <div className="relative min-h-[216px]">
        {chart.isPending || (!quote && !chart.isError) ? (
          <div className="text-ink-muted grid h-[216px] animate-pulse place-items-center text-[12px]">
            Loading PHP market history…
          </div>
        ) : !first || !last ? (
          <div className="text-ink-muted grid h-[216px] place-items-center text-center text-[12px]">
            <div>
              <p>Chart unavailable</p>
              <button
                type="button"
                onClick={() => void chart.refetch()}
                className="mt-3 inline-flex items-center gap-2 text-[#56e3b1]"
              >
                <RefreshCw size={14} /> Retry chart
              </button>
            </div>
          </div>
        ) : (
          <>
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="w-full touch-pan-y"
              role="img"
              aria-label={`Bitcoin ${range} ${mode} chart. First close ${money(Math.round(first.close * 100))}, latest close ${money(Math.round(last.close * 100))} PHP.`}
              onPointerLeave={() => setCursor(null)}
              onPointerMove={(event) => {
                const bounds = event.currentTarget.getBoundingClientRect();
                const position = Math.max(
                  0,
                  Math.min(
                    1,
                    (((event.clientX - bounds.left) / bounds.width) * W -
                      LEFT) /
                      (W - LEFT - RIGHT),
                  ),
                );
                const time = first.time + position * (last.time - first.time);
                let nearest = 0;
                for (let index = 1; index < points.length; index++)
                  if (
                    Math.abs(points[index]!.time - time) <
                    Math.abs(points[nearest]!.time - time)
                  )
                    nearest = index;
                setCursor(nearest);
              }}
            >
              <defs>
                <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity=".22" />
                  <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
              </defs>
              {[0, 1, 2, 3].map((index) => {
                const value = maximum - ((maximum - minimum) * index) / 3;
                return (
                  <g key={index}>
                    <line
                      x1={LEFT}
                      x2={W - RIGHT}
                      y1={y(value)}
                      y2={y(value)}
                      stroke="#ffffff"
                      strokeOpacity=".065"
                    />
                    <text
                      x={W - RIGHT + 8}
                      y={y(value) + 3}
                      fill="#878792"
                      fontSize="9"
                    >
                      ₱
                      {new Intl.NumberFormat("en-US", {
                        notation: "compact",
                        maximumFractionDigits: range === "1MIN" ? 6 : 3,
                      }).format(value)}
                    </text>
                  </g>
                );
              })}
              {mode === "line" ? (
                <>
                  <path
                    d={`${path} L${x(last)},${H - BOTTOM} L${x(first)},${H - BOTTOM} Z`}
                    fill={`url(#${id})`}
                  />
                  <path
                    d={path}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                </>
              ) : (
                <>
                  <path
                    d={flatPath}
                    fill="none"
                    stroke="#87b9a5"
                    strokeWidth="1.5"
                    strokeOpacity=".8"
                    strokeLinejoin="round"
                  />
                  {points.map((point) => {
                    const openY = y(point.open),
                      closeY = y(point.close);
                    const flat =
                      Math.abs(openY - closeY) < 1.5 &&
                      Math.abs(y(point.high) - y(point.low)) < 3;
                    const bodyWidth = flat ? Math.min(20, slot + 0.5) : width;
                    const bodyHeight = flat
                      ? 1.5
                      : Math.max(3, Math.abs(openY - closeY));
                    const candleColor = flat
                      ? "#87b9a5"
                      : point.close >= point.open
                        ? "#56e3b1"
                        : "#fb7185";
                    return (
                      <g
                        key={point.time}
                        stroke={candleColor}
                        fill={candleColor}
                      >
                        <line
                          x1={x(point)}
                          x2={x(point)}
                          y1={y(point.high)}
                          y2={y(point.low)}
                          strokeWidth="1"
                        />
                        <rect
                          x={x(point) - bodyWidth / 2}
                          y={(openY + closeY - bodyHeight) / 2}
                          width={bodyWidth}
                          height={bodyHeight}
                          stroke="none"
                        />
                      </g>
                    );
                  })}
                </>
              )}
              <text x={LEFT} y={H - 4} fill="#878792" fontSize="9">
                {labelTime(first.time)}
              </text>
              <text
                x={W - RIGHT}
                y={H - 4}
                textAnchor="end"
                fill="#878792"
                fontSize="9"
              >
                {labelTime(last.time)}
              </text>
              {selected && (
                <g>
                  <line
                    x1={x(selected)}
                    x2={x(selected)}
                    y1={TOP}
                    y2={H - BOTTOM}
                    stroke="#ffffff"
                    strokeOpacity=".4"
                  />
                </g>
              )}
            </svg>
            {selected && (
              <div className="pointer-events-none absolute top-0 left-2 rounded-lg border border-white/10 bg-[#242427] px-2.5 py-1.5 text-[10px] shadow-lg">
                <p className="font-semibold text-white">
                  {money(Math.round(selected.close * 100))} PHP
                </p>
                <p className="text-ink-muted">{labelTime(selected.time)}</p>
                <p className="text-ink-muted mt-1 text-[9px]">
                  O {money(Math.round(selected.open * 100))} · H{" "}
                  {money(Math.round(selected.high * 100))}
                  <br />L {money(Math.round(selected.low * 100))} · C{" "}
                  {money(Math.round(selected.close * 100))}
                </p>
                {selected.volume === 0 && (
                  <p className="text-ink-faint mt-1 text-[9px]">
                    No trades in this candle
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
      <div
        className="mt-1 flex justify-between gap-1"
        aria-label="Chart time range"
      >
        {BITCOIN_RANGES.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setRange(value);
              setCursor(null);
            }}
            aria-pressed={range === value}
            className={`min-h-10 flex-1 rounded-xl text-[11px] font-semibold transition-colors ${range === value ? "bg-[#56e3b1]/10 text-[#56e3b1]" : "text-ink-muted hover:bg-white/5"}`}
          >
            {value === "1MIN"
              ? "1 min"
              : value === "1H"
                ? "1 hr"
                : value === "1W"
                  ? "1 wk"
                  : value === "1M"
                    ? "1 mo"
                    : "1 yr"}
          </button>
        ))}
      </div>
      {updatedAt > 0 && (
        <p className="text-ink-faint mt-2 text-[9px]">
          Updated{" "}
          {new Date(updatedAt).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </p>
      )}
      {chart.isError && chart.data && (
        <p className="mt-2 text-[10px] text-amber-300">
          Chart refresh failed. Showing the last loaded history.
        </p>
      )}
    </section>
  );
}
