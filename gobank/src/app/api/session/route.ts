import { NextResponse } from "next/server";
import { z } from "zod";
import { closeSession, endSession, renewSession } from "~/server/session";

const requestSchema = z
	.object({
		action: z.enum(["resume", "close", "end"]),
		sessionId: z.string().regex(/^[a-f0-9]{64}$/),
		expiresAt: z.string().datetime().optional(),
	})
	.refine((input) => input.action !== "close" || !!input.expiresAt);
const options = { headers: { "Cache-Control": "no-store" } };

export async function POST(request: Request) {
	if (request.headers.get("origin") !== new URL(request.url).origin) {
		return NextResponse.json(
			{ error: "Forbidden" },
			{ ...options, status: 403 },
		);
	}
	const input = requestSchema.safeParse(await request.json().catch(() => null));
	if (!input.success)
		return NextResponse.json(
			{ error: "Invalid session request" },
			{ ...options, status: 400 },
		);
	const { action, sessionId } = input.data;
	if (action === "resume") {
		const session = await renewSession(sessionId);
		return NextResponse.json(session ?? { error: "Sign in to continue" }, {
			...options,
			status: session ? 200 : 401,
		});
	}
	if (action === "close" && input.data.expiresAt)
		await closeSession(sessionId, new Date(input.data.expiresAt));
	else if (action === "end") await endSession(sessionId);
	return new NextResponse(null, { ...options, status: 204 });
}
