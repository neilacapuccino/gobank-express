import assert from "node:assert/strict";
import { test } from "node:test";
import { readToken, signToken } from "./signed-token";

const SECRET = "a".repeat(32);
const OTHER_SECRET = "b".repeat(32);
const NOW = Date.parse("2026-01-01T00:00:00Z");
const ONE_MINUTE = 60_000;

const newToken = () => signToken({ sub: "123" }, SECRET, ONE_MINUTE, NOW);

void test("a signed token can be read until it expires", () => {
	const token = newToken();

	assert.deepEqual(readToken(token, SECRET, NOW + ONE_MINUTE - 1_000), {
		payload: { sub: "123" },
	});
	assert.equal(readToken(token, SECRET, NOW + ONE_MINUTE), null);
});

void test("a token with a swapped payload is rejected", () => {
	const [, signature] = newToken().split(".");
	const forgedBody = Buffer.from(
		JSON.stringify({ payload: { sub: "999" }, expiresAt: NOW + ONE_MINUTE }),
	).toString("base64url");

	assert.equal(readToken(`${forgedBody}.${signature}`, SECRET, NOW), null);
});

void test("a token signed with another secret is rejected", () => {
	assert.equal(readToken(newToken(), OTHER_SECRET, NOW), null);
});

void test("tokens in the wrong shape are rejected", () => {
	const token = newToken();
	const [body] = token.split(".");

	assert.equal(readToken(`${body}.`, SECRET, NOW), null);
	assert.equal(readToken("not-a-token", SECRET, NOW), null);
	assert.equal(readToken(`${token}.extra`, SECRET, NOW), null);
});
