import { createHmac, timingSafeEqual } from "node:crypto";

const sign = (body: string, secret: string) =>
	createHmac("sha256", secret).update(body).digest("base64url");

export function signToken(
	payload: unknown,
	secret: string,
	ttlMs: number,
	now = Date.now(),
) {
	const body = Buffer.from(
		JSON.stringify({ payload, expiresAt: now + ttlMs }),
	).toString("base64url");
	return `${body}.${sign(body, secret)}`;
}

export function readToken(token: string, secret: string, now = Date.now()) {
	const [body, signature, extra] = token.split(".");
	if (!body || !signature || extra !== undefined) return null;
	const expected = Buffer.from(sign(body, secret));
	const given = Buffer.from(signature);
	if (expected.length !== given.length || !timingSafeEqual(expected, given))
		return null;
	try {
		const parsed = JSON.parse(Buffer.from(body, "base64url").toString()) as {
			payload?: unknown;
			expiresAt?: unknown;
		};
		if (typeof parsed.expiresAt !== "number" || parsed.expiresAt <= now)
			return null;
		return { payload: parsed.payload };
	} catch {
		return null;
	}
}
