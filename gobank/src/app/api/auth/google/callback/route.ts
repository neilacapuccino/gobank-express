import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { currentSession } from "~/server/session";
import {
	linkGoogle,
	signInWithGoogle,
} from "~/features/auth/google/google.service";
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

	const [state, verifier, mode] = saved?.split(".") ?? [];
	const done = mode === "link" ? "/google-linked?google=" : "/?google=";
	const code = searchParams.get("code");

	if (searchParams.get("error")) return go(`${done}cancelled`);

	if (
		!googleEnabled() ||
		!state ||
		!verifier ||
		!code ||
		searchParams.get("state") !== state
	) {
		return go(`${done}failed`);
	}

	let profile;
	try {
		profile = await fetchGoogleProfile(code, verifier, origin);
	} catch {
		return go(`${done}failed`);
	}

	if (!profile.emailVerified) return go(`${done}unverified`);

	if (mode === "link") {
		const session = await currentSession();
		if (!session) return go(`${done}signed-out`);

		return go(`${done}${await linkGoogle(session.userId, profile)}`);
	}

	const result = await signInWithGoogle(profile);
	if (result.status === "pin") return go("/signin?google=pin");
	if (result.status === "register") return go("/register?google=new");

	return go("/?google=email-in-use");
}
