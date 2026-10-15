import { db } from "~/server/db";
import { asDatabaseError, fail, MESSAGES } from "~/server/errors";
import { startSession } from "~/server/session";
import { normalizeGmail } from "~/shared/lib/contact";
import { verifyAccountPin } from "../auth.service";
import {
	forgetGoogleIdentity,
	pendingGoogleIdentity,
	rememberGoogleIdentity,
	type GoogleIdentity,
} from "./google-identity.server";
import { GOOGLE_NOTICES } from "./google.rules";
import type { GoogleProfile } from "./google.server";

const accountFields = {
	id: true,
	username: true,
	googleId: true,
	gmail: true,
} as const;

const emailInUseMessage = GOOGLE_NOTICES["email-in-use"] ?? MESSAGES.unexpected;

async function findGoogleAccount(identity: GoogleIdentity) {
	const known = await db.user.findUnique({
		where: { googleId: identity.sub },
		select: accountFields,
	});
	const account =
		known ??
		(identity.gmail
			? await db.user.findUnique({
					where: { gmail: identity.gmail },
					select: accountFields,
				})
			: null);
	if (!account) return { status: "register" as const };
	if (account.googleId && account.googleId !== identity.sub) {
		return { status: "email-in-use" as const };
	}
	return { status: "pin" as const, identity, account };
}

export async function getPendingGoogleAccount() {
	const identity = await pendingGoogleIdentity();
	if (!identity) return { status: "missing" as const };
	return findGoogleAccount(identity);
}

export async function signInWithGoogle(profile: GoogleProfile) {
	const identity = {
		sub: profile.sub,
		gmail: profile.email ? normalizeGmail(profile.email) : null,
		name: profile.name,
	};
	const result = await findGoogleAccount(identity);
	if (result.status === "email-in-use") {
		await forgetGoogleIdentity();
		return result;
	}
	await rememberGoogleIdentity(identity);
	return result;
}

export async function signInWithGooglePin(pin: string) {
	const pending = await getPendingGoogleAccount();
	if (pending.status === "email-in-use") fail("CONFLICT", emailInUseMessage);
	if (pending.status !== "pin") {
		fail("UNAUTHORIZED", "Choose Google again to continue.");
	}
	const { account, identity } = pending;
	await verifyAccountPin(account.id, pin, MESSAGES.wrongPin);

	try {
		const linked = await db.user.updateMany({
			where: {
				id: account.id,
				OR: [
					{ googleId: identity.sub },
					...(identity.gmail
						? [{ googleId: null, gmail: identity.gmail }]
						: []),
				],
			},
			data: { googleId: identity.sub },
		});
		if (!linked.count) fail("CONFLICT", emailInUseMessage);
	} catch (error) {
		if (asDatabaseError(error)?.code === "P2002") {
			fail("CONFLICT", emailInUseMessage);
		}
		throw error;
	}

	const session = await startSession(account.id);
	await forgetGoogleIdentity();
	return session;
}
