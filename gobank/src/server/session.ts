import { createHash, randomBytes, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { cache } from "react";
import { env } from "~/env";
import { db } from "~/server/db";
import {
	SESSION_TTL_MS,
	SESSION_CLOSE_GRACE_MS,
} from "~/features/auth/session.rules";

const COOKIE = "gb_session_v2";
const LEGACY_COOKIE = "gb_session";
const runtime = globalThis as unknown as {
	gobankDevelopmentSessionId?: string;
};
const developmentId =
	env.NODE_ENV === "development"
		? (runtime.gobankDevelopmentSessionId ??= randomUUID())
		: null;

const hash = (token: string) =>
	createHash("sha256").update(token).digest("hex");

export async function startSession(userId: string) {
	const secret = randomBytes(32).toString("base64url");
	const token = developmentId ? `${developmentId}.${secret}` : secret;
	const now = new Date();
	await endSession();
	await db.session.deleteMany({ where: { expiresAt: { lt: now } } });
	await db.session.create({
		data: {
			id: hash(token),
			userId,
			expiresAt: new Date(now.getTime() + SESSION_TTL_MS),
		},
	});
	(await cookies()).set(COOKIE, token, {
		httpOnly: true,
		sameSite: "lax",
		secure: env.NODE_ENV === "production",
		path: "/",
	});
	return { sessionId: hash(token) };
}

export const currentSession = cache(async () => {
	const token = (await cookies()).get(COOKIE)?.value;
	if (!token || (developmentId && !token.startsWith(`${developmentId}.`)))
		return null;
	const session = await db.session.findUnique({
		where: { id: hash(token) },
		select: { id: true, userId: true, expiresAt: true },
	});
	if (!session) return null;
	if (session.expiresAt <= new Date()) {
		await db.session.deleteMany({
			where: { id: session.id, expiresAt: session.expiresAt },
		});
		return null;
	}
	return session;
});

export const currentUserId = cache(
	async () => (await currentSession())?.userId ?? null,
);

export async function renewSession(sessionId: string) {
	const session = await currentSession();
	if (session?.id !== sessionId) return null;
	const now = new Date();
	const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);
	const renewed = await db.session.updateMany({
		where: { id: session.id, expiresAt: { gt: now } },
		data: { expiresAt },
	});
	return renewed.count ? { expiresAt: expiresAt.toISOString() } : null;
}

export async function closeSession(sessionId: string, expectedExpiry: Date) {
	const session = await currentSession();
	if (session?.id !== sessionId) return;
	const now = new Date();
	const expiresAt = new Date(
		Math.min(
			session.expiresAt.getTime(),
			now.getTime() + SESSION_CLOSE_GRACE_MS,
		),
	);
	const closed = await db.session.updateMany({
		where: { id: session.id, expiresAt: expectedExpiry },
		data: { expiresAt },
	});
	if (!closed.count) return;
	const cleanup = setTimeout(
		() => {
			void db.session
				.deleteMany({ where: { id: session.id, expiresAt } })
				.catch(() => undefined);
		},
		Math.max(0, expiresAt.getTime() - now.getTime()),
	);
	cleanup.unref();
}

export async function endOtherSessions(userId: string) {
	const token = (await cookies()).get(COOKIE)?.value ?? "";
	await db.session.deleteMany({ where: { userId, id: { not: hash(token) } } });
}

export async function endSession(expectedSessionId?: string | null) {
	const store = await cookies();
	const currentToken = store.get(COOKIE)?.value;
	if (
		expectedSessionId !== undefined &&
		(!currentToken || hash(currentToken) !== expectedSessionId)
	)
		return;
	const tokens = [currentToken, store.get(LEGACY_COOKIE)?.value].filter(
		(token): token is string => !!token,
	);
	if (tokens.length)
		await db.session.deleteMany({ where: { id: { in: tokens.map(hash) } } });
	store.delete(COOKIE);
	store.delete(LEGACY_COOKIE);
}
