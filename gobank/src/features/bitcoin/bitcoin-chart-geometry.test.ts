import assert from "node:assert/strict";
import { test } from "node:test";
import type { BitcoinCandle } from "./bitcoin.types";
import {
	candleShape,
	CHART,
	createScale,
	DOWN_COLOR,
	FLAT_COLOR,
	nearestIndex,
	timeAtPointer,
	UP_COLOR,
} from "./bitcoin-chart-geometry";

const candle = (
	time: number,
	open: number,
	close: number,
	low = Math.min(open, close),
	high = Math.max(open, close),
): BitcoinCandle => ({ time, open, high, low, close, volume: 1 });

const points = [candle(0, 100, 120, 90), candle(1_000, 120, 200, 110, 210)];
const fullWidth = { left: 0, width: CHART.width } as DOMRect;

void test("the first and last candles sit at the edges of the plot", () => {
	const scale = createScale(points, "line");
	const [first, last] = points as [BitcoinCandle, BitcoinCandle];

	assert.equal(scale.x(first), CHART.left);
	assert.equal(scale.x(last), CHART.width - CHART.right);
});

void test("higher prices are drawn higher on the chart", () => {
	const scale = createScale(points, "candles");

	assert.ok(scale.y(200) < scale.y(100));
});

void test("the pointer picks the closest candle in time", () => {
	assert.equal(nearestIndex(points, 100), 0);
	assert.equal(nearestIndex(points, 900), 1);
});

void test("the pointer time stays inside the chart range", () => {
	assert.equal(timeAtPointer(CHART.left, fullWidth, 0, 1_000), 0);
	assert.equal(timeAtPointer(CHART.width * 2, fullWidth, 0, 1_000), 1_000);
});

void test("candles are colored by direction, and flat ones are muted", () => {
	const scale = createScale(points, "candles");

	assert.equal(candleShape(candle(0, 100, 150), scale).color, UP_COLOR);
	assert.equal(candleShape(candle(0, 150, 100), scale).color, DOWN_COLOR);
	assert.equal(candleShape(candle(0, 150, 150), scale).color, FLAT_COLOR);
});
