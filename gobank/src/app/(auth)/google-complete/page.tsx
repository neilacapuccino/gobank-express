import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { z } from "zod";
import { env } from "~/env";
import { SessionHandoff } from "~/features/auth/components/session-handoff";
import { readToken } from "~/features/auth/signed-token";
import { currentSession } from "~/server/session";

export const metadata: Metadata = {
	title: "Signing you in",
};

const handoff = z.object({ sessionId: z.string().min(1) });

export default async function GoogleCompletePage({
	searchParams,
}: {
	searchParams: Promise<{ token?: string }>;
}) {
	const { token } = await searchParams;
	const session = await currentSession();
	const verified =
		token && env.AUTH_SECRET ? readToken(token, env.AUTH_SECRET) : null;
	const payload = handoff.safeParse(verified?.payload);
	if (!session || !payload.success || payload.data.sessionId !== session.id) {
		redirect("/signin");
	}
	return <SessionHandoff sessionId={session.id} />;
}