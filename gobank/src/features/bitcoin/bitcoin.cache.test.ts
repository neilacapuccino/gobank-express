import assert from "node:assert/strict";
import test from "node:test";
import { createRequestCache } from "./bitcoin.cache";

function delayed<Value>() {
	let complete: ((value: Value) => void) | undefined;
	let fail: ((error: Error) => void) | undefined;
	const promise = new Promise<Value>((resolve, reject) => {
		complete = resolve;
		fail = reject;
	});
	return {
		promise,
		resolve(value: Value) {
			assert.ok(complete);
			complete(value);
		},
		reject(error: Error) {
			assert.ok(fail);
			fail(error);
		},
	};
}

void test("slow fetches stay shared and receive a full TTL after success", async () => {
	let now = 0;
	let calls = 0;
	const cached = createRequestCache<string, number>(
		() => 5_000,
		() => now,
	);
	const pending = delayed<number>();
	const load = () => {
		calls++;
		return pending.promise;
	};
	const first = cached("quote", load);
	await Promise.resolve();
	assert.equal(calls, 1);
	now = 12_000;
	assert.equal(cached("quote", load), first);
	assert.equal(calls, 1);
	pending.resolve(42);
	assert.equal(await first, 42);
	now = 16_999;
	assert.equal(cached("quote", load), first);
	now = 17_000;
	const refreshed = cached("quote", async () => {
		calls++;
		return 43;
	});
	assert.notEqual(refreshed, first);
	assert.equal(await refreshed, 43);
	assert.equal(calls, 2);
});

void test("rejected shared fetches are removed so the next call retries", async () => {
	let now = 0;
	const cached = createRequestCache<string, number>(
		() => 2_000,
		() => now,
	);
	const pending = delayed<number>();
	const first = cached("chart", () => pending.promise);
	now = 8_000;
	assert.equal(
		cached("chart", async () => 99),
		first,
	);
	const rejected = assert.rejects(first, /Feed unavailable/);
	pending.reject(new Error("Feed unavailable"));
	await rejected;
	const retry = cached("chart", async () => 7);
	assert.notEqual(retry, first);
	assert.equal(await retry, 7);
});

void test("ranges keep independent cached values and expiry periods", async () => {
	let now = 0;
	const cached = createRequestCache<"minute" | "hour", string>(
		(key) => (key === "minute" ? 2_000 : 5_000),
		() => now,
	);
	const minute = cached("minute", async () => "minute history");
	const hour = cached("hour", async () => "hour history");
	await Promise.all([minute, hour]);
	now = 2_000;
	assert.equal(
		cached("hour", async () => "wrong history"),
		hour,
	);
	const refreshed = cached("minute", async () => "new minute history");
	assert.notEqual(refreshed, minute);
	assert.equal(await refreshed, "new minute history");
	assert.equal(await hour, "hour history");
});

void test("synchronous loader failures also clear their cache entry", async () => {
	const cached = createRequestCache<string, number>(() => 5_000);
	await assert.rejects(
		cached("quote", () => {
			throw new Error("Loader failed");
		}),
		/Loader failed/,
	);
	assert.equal(await cached("quote", async () => 3), 3);
});
