import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "~/env";
import {
	googleEnabled,
	startGoogleSignIn,
} from "~/features/auth/google.server";
import { GOOGLE_COOKIE, GOOGLE_COOKIE_PATH } from "./cookie";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
	const { origin } = request.nextUrl;
	if (!googleEnabled()) {
		return NextResponse.redirect(new URL("/signin?google=unavailable", origin));
	}
	const { url, state, verifier } = startGoogleSignIn(origin);
	(await cookies()).set(GOOGLE_COOKIE, `${state}.${verifier}`, {
		httpOnly: true,
		sameSite: "lax",
		secure: env.NODE_ENV === "production",
		path: GOOGLE_COOKIE_PATH,
		maxAge: 10 * 60,
	});
	return NextResponse.redirect(url);
}
