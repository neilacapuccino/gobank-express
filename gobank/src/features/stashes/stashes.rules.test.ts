import assert from "node:assert/strict";
import { test } from "node:test";
import { goalAmountError, isValidGoalName } from "./stashes.rules";

void test("an empty amount shows no error while the user is still typing", () => {
	assert.equal(goalAmountError("", 0), null);
	assert.equal(goalAmountError("   ", 0), null);
});

void test("a zero amount is refused", () => {
	assert.equal(goalAmountError("0", 0), "Enter an amount above ₱0.00");
});

void test("an amount above the transaction limit is refused", () => {
	assert.match(goalAmountError("2000000", 200_000_000) ?? "", /^Maximum/);
});

void test("moving out more than the goal holds names the goal balance", () => {
	assert.equal(
		goalAmountError("700", 70_000, 63_801, "out"),
		"Only ₱638.01 is in this goal",
	);
});

void test("moving in more than the main balance names the main balance", () => {
	assert.equal(
		goalAmountError("700", 70_000, 50_000, "in"),
		"Insufficient balance. You have ₱500.00",
	);
});

void test("an amount within the available balance is accepted", () => {
	assert.equal(goalAmountError("100", 10_000, 50_000, "in"), null);
});

void test("a goal name needs 1 to 40 characters", () => {
	assert.equal(isValidGoalName("Trip"), true);
	assert.equal(isValidGoalName("   "), false);
	assert.equal(isValidGoalName("x".repeat(41)), false);
});
