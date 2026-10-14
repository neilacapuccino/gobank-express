import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { env } from "~/env";

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

export const googleEnabled = () =>
	Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.AUTH_SECRET);

const redirectUri = (origin: string) => `${origin}/api/auth/google/callback`;

const tokenResponse = z.object({ access_token: z.string().min(1) });
const profileResponse = z.object({
	sub: z.string().min(1),
	email: z.string().optional(),
	email_verified: z.boolean().optional(),
	name: z.string().optional(),
});

export type GoogleProfile = {
	sub: string;
	email: string | null;
	emailVerified: boolean;
	name: string;
};

export function startGoogleSignIn(origin: string) {
	const state = randomBytes(32).toString("base64url");
	const verifier = randomBytes(32).toString("base64url");
	const url = new URL(AUTH_URL);
	url.search = new URLSearchParams({
		client_id: env.GOOGLE_CLIENT_ID ?? "",
		redirect_uri: redirectUri(origin),
		response_type: "code",
		scope: "openid email profile",
		state,
		code_challenge: createHash("sha256").update(verifier).digest("base64url"),
		code_challenge_method: "S256",
		prompt: "select_account",
	}).toString();
	return { url: url.toString(), state, verifier };
}

export async function fetchGoogleProfile(
	code: string,
	verifier: string,
	origin: string,
): Promise<GoogleProfile> {
	const tokenReply = await fetch(TOKEN_URL, {
		method: "POST",
		headers: { "content-type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({
			code,
			code_verifier: verifier,
			client_id: env.GOOGLE_CLIENT_ID ?? "",
			client_secret: env.GOOGLE_CLIENT_SECRET ?? "",
			redirect_uri: redirectUri(origin),
			grant_type: "authorization_code",
		}),
		cache: "no-store",
	});
	if (!tokenReply.ok) throw new Error("Google rejected the sign-in code");
	const { access_token } = tokenResponse.parse(await tokenReply.json());

	const profileReply = await fetch(USERINFO_URL, {
		headers: { authorization: `Bearer ${access_token}` },
		cache: "no-store",
	});
	if (!profileReply.ok) throw new Error("Google did not return a profile");
	const profile = profileResponse.parse(await profileReply.json());
	return {
		sub: profile.sub,
		email: profile.email ?? null,
		emailVerified: profile.email_verified === true,
		name: profile.name?.trim() ?? "",
	};
}
