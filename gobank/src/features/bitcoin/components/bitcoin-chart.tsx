"use client";

import { useId, useState, type PointerEvent, type ReactNode } from "react";
import { CandlestickChart, ChartNoAxesCombined, RefreshCw } from "lucide-react";
import { cn } from "~/shared/lib/cn";
import { useBitcoinCandles } from "../hooks/use-bitcoin-candles";
import { groupCandles } from "../bitcoin-candles";
import {
	BITCOIN_CANDLES,
	BITCOIN_RANGES,
	money,
	type BitcoinCandle,
	type BitcoinQuote,
	type BitcoinRange,
} from "../bitcoin.types";
import {
	candleShape,
	CHART,
	createScale,
	DOWN_COLOR,
	FLAT_COLOR,
	gapPath,
	linePath,
	nearestIndex,
	PLOT_BOTTOM,
	timeAtPointer,
	toPhp,
	UP_COLOR,
	type ChartMode,
	type ChartScale,
} from "../bitcoin-chart-geometry";

const AXIS_COLOR = "#878792";
const GRID_LINES = [0, 1, 2, 3];
const ONE_MINUTE_BUCKET_MS = 3_000;

const RANGE_BUTTON: Record<BitcoinRange, string> = {
	"1MIN": "1 min",
	"1H": "1 hr",
	"1W": "1 wk",
	"1M": "1 mo",
	"1Y": "1 yr",
};

const RANGE_PERIOD: Record<BitcoinRange, string> = {
	"1MIN": "minute",
	"1H": "hour",
	"1W": "week",
	"1M": "30 days",
	"1Y": "year",
};

const MODES: { id: ChartMode; label: string }[] = [
	{ id: "line", label: "Line chart" },
	{ id: "candles", label: "Candlestick chart" },
];

const CLOCK_TIME: Intl.DateTimeFormatOptions = {
	hour: "2-digit",
	minute: "2-digit",
	second: "2-digit",
};

const centavos = (pesos: number) => Math.round(pesos * 100);

function timeLabel(time: number, range: BitcoinRange) {
	if (range === "1MIN") {
		return new Date(time).toLocaleString("en-US", {
			hour: "numeric",
			minute: "2-digit",
			second: "2-digit",
		});
	}

	if (range === "1H") {
		return new Date(time).toLocaleString("en-US", {
			hour: "numeric",
			minute: "2-digit",
		});
	}

	return new Date(time).toLocaleString("en-US", {
		month: "short",
		day: "numeric",
	});
}

function priceAxisLabel(price: number, range: BitcoinRange) {
	const compact = new Intl.NumberFormat("en-US", {
		notation: "compact",
		maximumFractionDigits: range === "1MIN" ? 6 : 3,
	});

	return `₱${compact.format(price)}`;
}

function PriceGrid({
	scale,
	range,
}: {
	scale: ChartScale;
	range: BitcoinRange;
}) {
	return GRID_LINES.map((index) => {
		const price = scale.maximum - ((scale.maximum - scale.minimum) * index) / 3;
		const lineY = scale.y(price);

		return (
			<g key={index}>
				<line
					x1={CHART.left}
					x2={CHART.width - CHART.right}
					y1={lineY}
					y2={lineY}
					stroke="#ffffff"
					strokeOpacity=".065"
				/>
				<text
					x={CHART.width - CHART.right + 8}
					y={lineY + 3}
					fill={AXIS_COLOR}
					fontSize="9"
				>
					{priceAxisLabel(price, range)}
				</text>
			</g>
		);
	});
}

function LineSeries({
	points,
	scale,
	color,
	gradientId,
}: {
	points: BitcoinCandle[];
	scale: ChartScale;
	color: string;
	gradientId: string;
}) {
	const first = points[0];
	const last = points.at(-1);
	if (!first || !last) return null;

	const path = linePath(points, scale);
	const area = `${path} L${scale.x(last)},${PLOT_BOTTOM} L${scale.x(first)},${PLOT_BOTTOM} Z`;

	return (
		<>
			<path d={area} fill={`url(#${gradientId})`} />
			<path
				d={path}
				fill="none"
				stroke={color}
				strokeWidth="2"
				strokeLinejoin="round"
			/>
		</>
	);
}

function CandleSeries({
	points,
	scale,
}: {
	points: BitcoinCandle[];
	scale: ChartScale;
}) {
	return (
		<>
			<path
				d={gapPath(points, scale)}
				fill="none"
				stroke={FLAT_COLOR}
				strokeWidth="1.5"
				strokeOpacity=".8"
				strokeLinejoin="round"
			/>

			{points.map((point) => {
				const shape = candleShape(point, scale);
				const centerX = scale.x(point);

				return (
					<g key={point.time} stroke={shape.color} fill={shape.color}>
						<line
							x1={centerX}
							x2={centerX}
							y1={scale.y(point.high)}
							y2={scale.y(point.low)}
							strokeWidth="1"
						/>
						<rect
							x={centerX - shape.bodyWidth / 2}
							y={shape.bodyTop}
							width={shape.bodyWidth}
							height={shape.bodyHeight}
							stroke="none"
						/>
					</g>
				);
			})}
		</>
	);
}

function CandleTooltip({
	candle,
	range,
}: {
	candle: BitcoinCandle;
	range: BitcoinRange;
}) {
	return (
		<div className="pointer-events-none absolute top-0 left-2 rounded-lg border border-white/10 bg-[#242427] px-2.5 py-1.5 text-[10px] shadow-lg">
			<p className="font-semibold text-white">
				{money(centavos(candle.close))} PHP
			</p>
			<p className="text-ink-muted">{timeLabel(candle.time, range)}</p>
			<p className="text-ink-muted mt-1 text-[9px]">
				O {money(centavos(candle.open))} · H {money(centavos(candle.high))}
				<br />L {money(centavos(candle.low))} · C{" "}
				{money(centavos(candle.close))}
			</p>
			{candle.volume === 0 ? (
				<p className="text-ink-faint mt-1 text-[9px]">
					No trades in this candle
				</p>
			) : null}
		</div>
	);
}

function ModeSwitch({
	selected,
	onSelect,
}: {
	selected: ChartMode;
	onSelect: (mode: ChartMode) => void;
}) {
	return (
		<div className="flex rounded-lg bg-white/[.04] p-0.5">
			{MODES.map(({ id, label }) => (
				<button
					key={id}
					type="button"
					aria-label={label}
					aria-pressed={selected === id}
					onClick={() => onSelect(id)}
					className={cn(
						"grid h-8 w-8 place-items-center rounded-md",
						selected === id ? "bg-white/10 text-white" : "text-ink-muted",
					)}
				>
					{id === "line" ? (
						<ChartNoAxesCombined size={15} />
					) : (
						<CandlestickChart size={15} />
					)}
				</button>
			))}
		</div>
	);
}

function RangeSwitch({
	selected,
	onSelect,
}: {
	selected: BitcoinRange;
	onSelect: (range: BitcoinRange) => void;
}) {
	return (
		<div
			className="mt-1 flex justify-between gap-1"
			aria-label="Chart time range"
		>
			{BITCOIN_RANGES.map((range) => (
				<button
					key={range}
					type="button"
					onClick={() => onSelect(range)}
					aria-pressed={selected === range}
					className={cn(
						"min-h-10 flex-1 rounded-xl text-[11px] font-semibold transition-colors",
						selected === range
							? "bg-mint/10 text-mint"
							: "text-ink-muted hover:bg-white/5",
					)}
				>
					{RANGE_BUTTON[range]}
				</button>
			))}
		</div>
	);
}

function ChartMessage({ children }: { children: ReactNode }) {
	return (
		<div className="text-ink-muted grid h-[216px] place-items-center text-center text-[12px]">
			{children}
		</div>
	);
}

export function BitcoinChart({ quote }: { quote?: BitcoinQuote }) {
	const [range, setRange] = useState<BitcoinRange>("1H");
	const [mode, setMode] = useState<ChartMode>("candles");
	const [cursor, setCursor] = useState<number | null>(null);
	const gradientId = useId().replaceAll(":", "");

	const { chart, points: history, updatedAt } = useBitcoinCandles(range);

	const candles =
		range === "1MIN" ? groupCandles(history, ONE_MINUTE_BUCKET_MS) : history;
	const points = quote ? toPhp(candles, quote.phpPerQuote) : [];
	const first = points[0];
	const last = points.at(-1);

	const scale = createScale(points, mode);
	const rising = Boolean(first && last && last.close >= first.close);
	const color = rising ? UP_COLOR : DOWN_COLOR;
	const change =
		first && last ? ((last.close - first.open) / first.open) * 100 : null;
	const selected =
		cursor === null ? undefined : points[Math.min(cursor, points.length - 1)];

	const loading = chart.isPending || (!quote && !chart.isError);
	const subtitle =
		range === "1MIN"
			? "3-second candles · last 60 seconds"
			: BITCOIN_CANDLES[range].label;

	const changeRange = (next: BitcoinRange) => {
		setRange(next);
		setCursor(null);
	};

	const changeMode = (next: ChartMode) => {
		setMode(next);
		setCursor(null);
	};

	const followPointer = (event: PointerEvent<SVGSVGElement>) => {
		if (!first || !last) return;

		const bounds = event.currentTarget.getBoundingClientRect();
		const time = timeAtPointer(event.clientX, bounds, first.time, last.time);
		setCursor(nearestIndex(points, time));
	};

	return (
		<section
			className="bg-card rounded-[24px] border border-white/[.07] p-4"
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
							<span className="ml-1">past {RANGE_PERIOD[range]}</span>
						</>
					)}
				</p>
				<ModeSwitch selected={mode} onSelect={changeMode} />
			</div>

			<div className="mb-3 flex items-center justify-between gap-2 text-[9px]">
				<span className="text-ink-faint">{subtitle}</span>
			</div>

			<div className="relative min-h-[216px]">
				{loading ? (
					<ChartMessage>
						<span className="animate-pulse">Loading PHP market history…</span>
					</ChartMessage>
				) : null}

				{!loading && (!first || !last) ? (
					<ChartMessage>
						<div>
							<p>Chart unavailable</p>
							<button
								type="button"
								onClick={() => void chart.refetch()}
								className="text-mint mt-3 inline-flex items-center gap-2"
							>
								<RefreshCw size={14} /> Retry chart
							</button>
						</div>
					</ChartMessage>
				) : null}

				{!loading && first && last ? (
					<>
						<svg
							viewBox={`0 0 ${CHART.width} ${CHART.height}`}
							className="w-full touch-pan-y"
							role="img"
							aria-label={`Bitcoin ${range} ${mode} chart. First close ${money(centavos(first.close))}, latest close ${money(centavos(last.close))} PHP.`}
							onPointerLeave={() => setCursor(null)}
							onPointerMove={followPointer}
						>
							<defs>
								<linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
									<stop offset="0%" stopColor={color} stopOpacity=".22" />
									<stop offset="100%" stopColor={color} stopOpacity="0" />
								</linearGradient>
							</defs>

							<PriceGrid scale={scale} range={range} />

							{mode === "line" ? (
								<LineSeries
									points={points}
									scale={scale}
									color={color}
									gradientId={gradientId}
								/>
							) : (
								<CandleSeries points={points} scale={scale} />
							)}

							<text
								x={CHART.left}
								y={CHART.height - 4}
								fill={AXIS_COLOR}
								fontSize="9"
							>
								{timeLabel(first.time, range)}
							</text>
							<text
								x={CHART.width - CHART.right}
								y={CHART.height - 4}
								textAnchor="end"
								fill={AXIS_COLOR}
								fontSize="9"
							>
								{timeLabel(last.time, range)}
							</text>

							{selected ? (
								<line
									x1={scale.x(selected)}
									x2={scale.x(selected)}
									y1={CHART.top}
									y2={PLOT_BOTTOM}
									stroke="#ffffff"
									strokeOpacity=".4"
								/>
							) : null}
						</svg>

						{selected ? (
							<CandleTooltip candle={selected} range={range} />
						) : null}
					</>
				) : null}
			</div>

			<RangeSwitch selected={range} onSelect={changeRange} />

			{updatedAt > 0 ? (
				<p className="text-ink-faint mt-2 text-[9px]">
					Updated {new Date(updatedAt).toLocaleTimeString("en-US", CLOCK_TIME)}
				</p>
			) : null}

			{chart.isError && chart.data ? (
				<p className="mt-2 text-[10px] text-amber-300">
					Chart refresh failed. Showing the last loaded history.
				</p>
			) : null}
		</section>
	);
}
