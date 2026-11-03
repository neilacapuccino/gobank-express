import { NextResponse } from "next/server";
import { z } from "zod";
import { closeSession, endSession, renewSession } from "~/server/session";

const sessionRequest = z
	.object({
		action: z.enum(["resume", "close", "end"]),
		sessionId: z.string().regex(/^[a-f0-9]{64}$/),
		expiresAt: z.string().datetime().optional(),
	})
	.refine((input) => input.action !== "close" || !!input.expiresAt);

const NO_STORE = { "Cache-Control": "no-store" };

const reply = (body: unknown, status: number) =>
	NextResponse.json(body, { status, headers: NO_STORE });

const isSameOrigin = (request: Request) =>
	request.headers.get("origin") === new URL(request.url).origin;

export async function POST(request: Request) {
	if (!isSameOrigin(request)) return reply({ error: "Forbidden" }, 403);

	const body: unknown = await request.json().catch(() => null);
	const input = sessionRequest.safeParse(body);
	if (!input.success) return reply({ error: "Invalid session request" }, 400);

	const { action, sessionId, expiresAt } = input.data;

	if (action === "resume") {
		const session = await renewSession(sessionId);
		return session
			? reply(session, 200)
			: reply({ error: "Sign in to continue" }, 401);
	}

	if (action === "close" && expiresAt) {
		await closeSession(sessionId, new Date(expiresAt));
	}

	if (action === "end") await endSession(sessionId);

	return new NextResponse(null, { status: 204, headers: NO_STORE });
}
