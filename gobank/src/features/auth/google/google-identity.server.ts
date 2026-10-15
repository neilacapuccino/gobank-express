import { cookies } from "next/headers";
import { z } from "zod";
import { env } from "~/env";
import { readToken, signToken } from "./signed-token";

const COOKIE = "gb_google_identity";
const MAX_AGE_SECONDS = 15 * 60;

const identity = z.object({
	sub: z.string().min(1),
	gmail: z.string().nullable(),
	name: z.string(),
});

export type GoogleIdentity = z.infer<typeof identity>;

export async function rememberGoogleIdentity(value: GoogleIdentity) {
	if (!env.AUTH_SECRET) throw new Error("AUTH_SECRET is not set");
	(await cookies()).set(
		COOKIE,
		signToken(value, env.AUTH_SECRET, MAX_AGE_SECONDS * 1000),
		{
			httpOnly: true,
			sameSite: "lax",
			secure: env.NODE_ENV === "production",
			path: "/",
			maxAge: MAX_AGE_SECONDS,
		},
	);
}

export async function pendingGoogleIdentity(): Promise<GoogleIdentity | null> {
	const token = (await cookies()).get(COOKIE)?.value;
	if (!token || !env.AUTH_SECRET) return null;
	const verified = readToken(token, env.AUTH_SECRET);
	const parsed = identity.safeParse(verified?.payload);
	return parsed.success ? parsed.data : null;
}

export async function forgetGoogleIdentity() {
	(await cookies()).delete(COOKIE);
}
