import assert from "node:assert/strict";
import { test } from "node:test";
import { readToken, signToken } from "./signed-token";

const SECRET = "a".repeat(32);
const NOW = Date.parse("2026-01-01T00:00:00Z");

void test("signed tokens round-trip until they expire", () => {
	const token = signToken({ sub: "123" }, SECRET, 60_000, NOW);
	assert.deepEqual(readToken(token, SECRET, NOW + 59_000), {
		payload: { sub: "123" },
	});
	assert.equal(readToken(token, SECRET, NOW + 60_000), null);
});

void test("signed tokens reject tampering and the wrong secret", () => {
	const token = signToken({ sub: "123" }, SECRET, 60_000, NOW);
	const [body, signature] = token.split(".") as [string, string];
	const forged = Buffer.from(
		JSON.stringify({ payload: { sub: "999" }, expiresAt: NOW + 60_000 }),
	).toString("base64url");
	assert.equal(readToken(`${forged}.${signature}`, SECRET, NOW), null);
	assert.equal(readToken(token, "b".repeat(32), NOW), null);
	assert.equal(readToken(`${body}.`, SECRET, NOW), null);
	assert.equal(readToken("not-a-token", SECRET, NOW), null);
	assert.equal(readToken(`${token}.extra`, SECRET, NOW), null);
});
