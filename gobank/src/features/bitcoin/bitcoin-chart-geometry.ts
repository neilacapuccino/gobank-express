import type { BitcoinCandle } from "./bitcoin.types";

export type ChartMode = "line" | "candles";

export const CHART = {
	width: 360,
	height: 216,
	left: 12,
	right: 68,
	top: 16,
	bottom: 26,
};

const PLOT_WIDTH = CHART.width - CHART.left - CHART.right;
export const PLOT_BOTTOM = CHART.height - CHART.bottom;

const PLOT_HEIGHT = CHART.height - CHART.top - CHART.bottom;
const PADDING_RATIO = 0.12;
const FLAT_PIXELS = 1.5;

export const UP_COLOR = "#56e3b1";
export const DOWN_COLOR = "#fb7185";
export const FLAT_COLOR = "#87b9a5";

const clamp = (value: number, min: number, max: number) =>
	Math.min(max, Math.max(min, value));

export const toPhp = (candles: BitcoinCandle[], phpPerQuote: number) =>
	candles.map((candle) => ({
		...candle,
		open: candle.open * phpPerQuote,
		high: candle.high * phpPerQuote,
		low: candle.low * phpPerQuote,
		close: candle.close * phpPerQuote,
	}));

export function createScale(points: BitcoinCandle[], mode: ChartMode) {
	const lows = points.map((point) =>
		mode === "candles" ? point.low : point.close,
	);
	const highs = points.map((point) =>
		mode === "candles" ? point.high : point.close,
	);
	const low = Math.min(...lows);
	const high = Math.max(...highs);

	const spread = Math.max(high - low, high * 0.00001, 0.01);
	const minimum = low - spread * PADDING_RATIO;
	const maximum = high + spread * PADDING_RATIO;

	const firstTime = points[0]?.time ?? 0;
	const lastTime = points.at(-1)?.time ?? 0;
	const timeSpan = Math.max(1, lastTime - firstTime);

	const y = (price: number) =>
		CHART.top + ((maximum - price) / (maximum - minimum)) * PLOT_HEIGHT;

	const x = (point: BitcoinCandle) =>
		CHART.left + ((point.time - firstTime) / timeSpan) * PLOT_WIDTH;

	const slot = PLOT_WIDTH / Math.max(points.length - 1, 1);
	const candleWidth = Math.min(12, Math.max(1, slot * 0.72));

	return { x, y, minimum, maximum, slot, candleWidth };
}

export type ChartScale = ReturnType<typeof createScale>;

export const linePath = (points: BitcoinCandle[], scale: ChartScale) =>
	points
		.map((point, index) => {
			const command = index === 0 ? "M" : "L";
			return `${command}${scale.x(point).toFixed(2)},${scale.y(point.close).toFixed(2)}`;
		})
		.join(" ");

export function gapPath(points: BitcoinCandle[], scale: ChartScale) {
	return points
		.map((point, index) => {
			const previous = points[index - 1];
			if (!previous) return "";

			const jump = Math.abs(scale.y(point.open) - scale.y(previous.close));
			if (jump >= FLAT_PIXELS) return "";

			return `M${scale.x(previous)},${scale.y(previous.close)} L${scale.x(point)},${scale.y(point.open)}`;
		})
		.join(" ");
}

export function candleShape(point: BitcoinCandle, scale: ChartScale) {
	const openY = scale.y(point.open);
	const closeY = scale.y(point.close);

	const flat =
		Math.abs(openY - closeY) < FLAT_PIXELS &&
		Math.abs(scale.y(point.high) - scale.y(point.low)) < FLAT_PIXELS * 2;

	const bodyWidth = flat ? Math.min(20, scale.slot + 0.5) : scale.candleWidth;
	const bodyHeight = flat ? FLAT_PIXELS : Math.max(3, Math.abs(openY - closeY));

	let color = point.close >= point.open ? UP_COLOR : DOWN_COLOR;
	if (flat) color = FLAT_COLOR;

	return {
		color,
		bodyWidth,
		bodyHeight,
		bodyTop: (openY + closeY - bodyHeight) / 2,
	};
}

export function timeAtPointer(
	clientX: number,
	bounds: DOMRect,
	firstTime: number,
	lastTime: number,
) {
	const chartX = ((clientX - bounds.left) / bounds.width) * CHART.width;
	const position = clamp((chartX - CHART.left) / PLOT_WIDTH, 0, 1);

	return firstTime + position * (lastTime - firstTime);
}

export function nearestIndex(points: BitcoinCandle[], time: number) {
	let nearest = 0;

	points.forEach((point, index) => {
		const best = points[nearest];
		if (best && Math.abs(point.time - time) < Math.abs(best.time - time)) {
			nearest = index;
		}
	});

	return nearest;
}
