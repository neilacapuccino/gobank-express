import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { env } from "~/env";

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

const tokenResponse = z.object({ access_token: z.string().min(1) });

const profileResponse = z.object({
	sub: z.string().min(1),
	email: z.string().optional(),
	email_verified: z.boolean().optional(),
	name: z.string().optional(),
	picture: z.string().url().optional(),
});

export type GoogleProfile = {
	sub: string;
	email: string | null;
	emailVerified: boolean;
	name: string;
	picture: string | null;
};

export const googleEnabled = () =>
	Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.AUTH_SECRET);

const redirectUri = (origin: string) => `${origin}/api/auth/google/callback`;

const randomToken = () => randomBytes(32).toString("base64url");

const codeChallengeFor = (verifier: string) =>
	createHash("sha256").update(verifier).digest("base64url");

export function startGoogleSignIn(origin: string) {
	const state = randomToken();
	const verifier = randomToken();

	const url = new URL(AUTH_URL);
	url.search = new URLSearchParams({
		client_id: env.GOOGLE_CLIENT_ID ?? "",
		redirect_uri: redirectUri(origin),
		response_type: "code",
		scope: "openid email profile",
		state,
		code_challenge: codeChallengeFor(verifier),
		code_challenge_method: "S256",
		prompt: "select_account",
	}).toString();

	return { url: url.toString(), state, verifier };
}

async function exchangeCodeForAccessToken(
	code: string,
	verifier: string,
	origin: string,
) {
	const reply = await fetch(TOKEN_URL, {
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
	if (!reply.ok) throw new Error("Google rejected the sign-in code");

	const { access_token } = tokenResponse.parse(await reply.json());
	return access_token;
}

export async function fetchGoogleProfile(
	code: string,
	verifier: string,
	origin: string,
): Promise<GoogleProfile> {
	const accessToken = await exchangeCodeForAccessToken(code, verifier, origin);

	const reply = await fetch(USERINFO_URL, {
		headers: { authorization: `Bearer ${accessToken}` },
		cache: "no-store",
	});
	if (!reply.ok) throw new Error("Google did not return a profile");

	const profile = profileResponse.parse(await reply.json());

	return {
		sub: profile.sub,
		email: profile.email ?? null,
		emailVerified: profile.email_verified === true,
		name: profile.name?.trim() ?? "",
		picture: profile.picture ?? null,
	};
}
