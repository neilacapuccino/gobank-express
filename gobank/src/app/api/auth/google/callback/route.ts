import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { signInWithGoogle } from "~/features/auth/auth.service";
import { env } from "~/env";
import { signToken } from "~/features/auth/signed-token";
import {
	fetchGoogleProfile,
	googleEnabled,
} from "~/features/auth/google.server";
import { GOOGLE_COOKIE, GOOGLE_COOKIE_PATH } from "../cookie";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
	const { origin, searchParams } = request.nextUrl;
	const go = (path: string) => NextResponse.redirect(new URL(path, origin));

	const store = await cookies();
	const saved = store.get(GOOGLE_COOKIE)?.value;
	store.delete({ name: GOOGLE_COOKIE, path: GOOGLE_COOKIE_PATH });

	if (searchParams.get("error")) return go("/signin?google=cancelled");
	const [state, verifier] = saved?.split(".") ?? [];
	const code = searchParams.get("code");
	if (
		!googleEnabled() ||
		!state ||
		!verifier ||
		!code ||
		searchParams.get("state") !== state
	) {
		return go("/signin?google=failed");
	}

	let profile;
	try {
		profile = await fetchGoogleProfile(code, verifier, origin);
	} catch {
		return go("/signin?google=failed");
	}
	if (!profile.emailVerified) return go("/signin?google=unverified");

	const secret = env.AUTH_SECRET;
	if (!secret) return go("/signin?google=failed");
	const result = await signInWithGoogle(profile);
	if (result.status === "signed-in") {
		const token = signToken({ sessionId: result.sessionId }, secret, 60_000);
		return go(`/google-complete?token=${encodeURIComponent(token)}`);
	}
	if (result.status === "register") return go("/register");
	return go("/signin?google=email-in-use");
}
