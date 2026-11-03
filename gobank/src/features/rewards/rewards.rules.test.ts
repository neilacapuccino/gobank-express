import assert from "node:assert/strict";
import { test } from "node:test";
import {
	convertOptions,
	pointsToNextPeso,
	redeemablePoints,
} from "./rewards.rules";

void test("the progress bar counts points left until the first ₱1.00", () => {
	assert.equal(pointsToNextPeso(41), 59);
	assert.equal(pointsToNextPeso(100), 0);
	assert.equal(pointsToNextPeso(150), 0);
});

void test("only whole hundreds of points can be converted", () => {
	assert.equal(redeemablePoints(99), 0);
	assert.equal(redeemablePoints(250), 200);
});

void test("convert options end with converting every point you can", () => {
	assert.deepEqual(convertOptions(250), [100, 200]);
	assert.deepEqual(convertOptions(500), [100, 500]);
});

void test("at most four convert options are shown", () => {
	assert.deepEqual(convertOptions(6_000), [500, 1_000, 5_000, 6_000]);
});
