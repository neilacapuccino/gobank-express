"use client";

import { useId, useState } from "react";
import { CandlestickChart, ChartNoAxesCombined, RefreshCw } from "lucide-react";
import { api } from "~/trpc/react";
import {
  BITCOIN_RANGES,
  usdt,
  type BitcoinCandle,
  type BitcoinRange,
} from "../bitcoin.types";

const W = 360,
  H = 216,
  LEFT = 4,
  RIGHT = 54,
  TOP = 16,
  BOTTOM = 26;

export function BitcoinChart() {
  const [range, setRange] = useState<BitcoinRange>("1D");
  const [mode, setMode] = useState<"line" | "candles">("line");
  const [cursor, setCursor] = useState<number | null>(null);
  const id = useId().replaceAll(":", "");
  const chart = api.bitcoin.chart.useQuery(
    { range },
    { staleTime: 60_000, refetchInterval: 60_000, retry: 1 },
  );
  const points = chart.data ?? [];
  const first = points[0];
  const last = points.at(-1);
  const low = Math.min(
    ...points.map((p) => (mode === "candles" ? p.low : p.close)),
  );
  const high = Math.max(
    ...points.map((p) => (mode === "candles" ? p.high : p.close)),
  );
  const spread = Math.max(high - low, high * 0.002);
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
  const up = !!first && !!last && last.close >= first.close;
  const color = up ? "#56e3b1" : "#fb7185";
  const selected =
    cursor === null ? undefined : points[Math.min(cursor, points.length - 1)];
  const change =
    first && last ? ((last.close - first.open) / first.open) * 100 : null;
  const labelTime = (time: number) =>
    new Date(time).toLocaleString(
      "en-US",
      range === "1H" || range === "1D"
        ? { hour: "numeric", minute: "2-digit" }
        : { month: "short", day: "numeric" },
    );
  const width = Math.max(
    1,
    ((W - LEFT - RIGHT) / Math.max(points.length, 1)) * 0.55,
  );

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
                {range === "1D"
                  ? "24 hours"
                  : range === "1H"
                    ? "hour"
                    : range === "1W"
                      ? "week"
                      : range === "1M"
                        ? "30 days"
                        : "90 days"}
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
      <div className="relative min-h-[216px]">
        {chart.isPending ? (
          <div className="text-ink-muted grid h-[216px] animate-pulse place-items-center text-[12px]">
            Loading market history…
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
              aria-label={`Bitcoin ${range} ${mode} chart. First close ${usdt(Math.round(first.close * 100))}, latest close ${usdt(Math.round(last.close * 100))} USDT.`}
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
                      strokeDasharray="3 5"
                    />
                    <text
                      x={W - RIGHT + 8}
                      y={y(value) + 3}
                      fill="#878792"
                      fontSize="9"
                    >
                      {new Intl.NumberFormat("en-US", {
                        notation: "compact",
                        maximumFractionDigits: 1,
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
                  <circle cx={x(last)} cy={y(last.close)} r="3" fill={color} />
                </>
              ) : (
                points.map((point) => (
                  <g
                    key={point.time}
                    stroke={point.close >= point.open ? "#56e3b1" : "#fb7185"}
                    fill={point.close >= point.open ? "#56e3b1" : "#fb7185"}
                  >
                    <line
                      x1={x(point)}
                      x2={x(point)}
                      y1={y(point.high)}
                      y2={y(point.low)}
                      strokeWidth="1"
                    />
                    <rect
                      x={x(point) - width / 2}
                      y={y(Math.max(point.open, point.close))}
                      width={width}
                      height={Math.max(
                        1,
                        Math.abs(y(point.open) - y(point.close)),
                      )}
                      stroke="none"
                    />
                  </g>
                ))
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
                    strokeDasharray="3 3"
                  />
                  <circle
                    cx={x(selected)}
                    cy={y(selected.close)}
                    r="4"
                    fill={color}
                    stroke="#171719"
                    strokeWidth="2"
                  />
                </g>
              )}
            </svg>
            {selected && (
              <div className="pointer-events-none absolute top-0 left-2 rounded-lg border border-white/10 bg-[#242427] px-2.5 py-1.5 text-[10px] shadow-lg">
                <p className="font-semibold text-white">
                  {usdt(Math.round(selected.close * 100))} USDT
                </p>
                <p className="text-ink-muted">{labelTime(selected.time)}</p>
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
            {value}
          </button>
        ))}
      </div>
      {chart.isError && chart.data && (
        <p className="mt-2 text-[10px] text-amber-300">
          Chart refresh failed. Showing the last loaded history.
        </p>
      )}
    </section>
  );
}
