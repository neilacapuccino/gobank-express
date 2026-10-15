import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { signInWithGoogle } from "~/features/auth/google/google.service";
import {
	fetchGoogleProfile,
	googleEnabled,
} from "~/features/auth/google/google.server";
import {
	GOOGLE_COOKIE,
	GOOGLE_COOKIE_PATH,
} from "~/features/auth/google/google.rules";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
	const { origin, searchParams } = request.nextUrl;
	const go = (path: string) => NextResponse.redirect(new URL(path, origin));

	const store = await cookies();
	const saved = store.get(GOOGLE_COOKIE)?.value;
	store.delete({ name: GOOGLE_COOKIE, path: GOOGLE_COOKIE_PATH });

	if (searchParams.get("error")) return go("/?google=cancelled");
	const [state, verifier] = saved?.split(".") ?? [];
	const code = searchParams.get("code");
	if (
		!googleEnabled() ||
		!state ||
		!verifier ||
		!code ||
		searchParams.get("state") !== state
	) {
		return go("/?google=failed");
	}

	let profile;
	try {
		profile = await fetchGoogleProfile(code, verifier, origin);
	} catch {
		return go("/?google=failed");
	}
	if (!profile.emailVerified) return go("/?google=unverified");

	const result = await signInWithGoogle(profile);
	if (result.status === "pin") return go("/signin?google=pin");
	if (result.status === "register") return go("/register");
	return go("/?google=email-in-use");
}
