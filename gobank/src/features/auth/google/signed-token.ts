import { createHmac, timingSafeEqual } from "node:crypto";

type SignedBody = { payload?: unknown; expiresAt?: unknown };

const sign = (body: string, secret: string) =>
	createHmac("sha256", secret).update(body).digest("base64url");

const encode = (value: unknown) =>
	Buffer.from(JSON.stringify(value)).toString("base64url");

function decode(body: string): SignedBody | null {
	try {
		return JSON.parse(Buffer.from(body, "base64url").toString()) as SignedBody;
	} catch {
		return null;
	}
}

function signaturesMatch(body: string, signature: string, secret: string) {
	const expected = Buffer.from(sign(body, secret));
	const given = Buffer.from(signature);

	return expected.length === given.length && timingSafeEqual(expected, given);
}

export function signToken(
	payload: unknown,
	secret: string,
	ttlMs: number,
	now = Date.now(),
) {
	const body = encode({ payload, expiresAt: now + ttlMs });

	return `${body}.${sign(body, secret)}`;
}

export function readToken(token: string, secret: string, now = Date.now()) {
	const [body, signature, extra] = token.split(".");

	const wellFormed = body && signature && extra === undefined;
	if (!wellFormed || !signaturesMatch(body, signature, secret)) return null;

	const decoded = decode(body);
	const expiresAt = decoded?.expiresAt;
	if (typeof expiresAt !== "number" || expiresAt <= now) return null;

	return { payload: decoded?.payload };
}
