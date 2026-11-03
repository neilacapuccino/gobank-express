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

const ACCOUNT_FIELDS = {
	id: true,
	username: true,
	googleId: true,
	gmail: true,
} as const;

const EMAIL_IN_USE = GOOGLE_NOTICES["email-in-use"] ?? MESSAGES.unexpected;

const isDuplicateValue = (error: unknown) =>
	asDatabaseError(error)?.code === "P2002";

const gmailOf = (profile: GoogleProfile) =>
	profile.email ? normalizeGmail(profile.email) : null;

async function findAccountByGoogle(identity: GoogleIdentity) {
	const byGoogleId = await db.user.findUnique({
		where: { googleId: identity.sub },
		select: ACCOUNT_FIELDS,
	});
	if (byGoogleId || !identity.gmail) return byGoogleId;

	return db.user.findUnique({
		where: { gmail: identity.gmail },
		select: ACCOUNT_FIELDS,
	});
}

async function findGoogleAccount(identity: GoogleIdentity) {
	const account = await findAccountByGoogle(identity);
	if (!account) return { status: "register" as const };

	const linkedToAnotherGoogle =
		account.googleId !== null && account.googleId !== identity.sub;
	if (linkedToAnotherGoogle) return { status: "email-in-use" as const };

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
		gmail: gmailOf(profile),
		name: profile.name,
	};

	const result = await findGoogleAccount(identity);

	if (result.status === "email-in-use") {
		await forgetGoogleIdentity();
	} else {
		await rememberGoogleIdentity(identity);
	}

	return result;
}

export async function linkGoogle(userId: string, profile: GoogleProfile) {
	const gmail = gmailOf(profile);
	if (!gmail) return "not-gmail";

	try {
		const linked = await db.user.updateMany({
			where: { id: userId, googleId: null },
			data: { googleId: profile.sub, gmail },
		});

		return linked.count ? "linked" : "already-linked";
	} catch (error) {
		if (isDuplicateValue(error)) return "email-in-use";
		throw error;
	}
}

async function attachGoogleId(accountId: string, identity: GoogleIdentity) {
	const sameGoogle = { googleId: identity.sub };
	const unlinkedSameGmail = identity.gmail
		? [{ googleId: null, gmail: identity.gmail }]
		: [];

	try {
		const linked = await db.user.updateMany({
			where: { id: accountId, OR: [sameGoogle, ...unlinkedSameGmail] },
			data: { googleId: identity.sub },
		});

		if (!linked.count) fail("CONFLICT", EMAIL_IN_USE);
	} catch (error) {
		if (isDuplicateValue(error)) fail("CONFLICT", EMAIL_IN_USE);
		throw error;
	}
}

export async function signInWithGooglePin(pin: string) {
	const pending = await getPendingGoogleAccount();

	if (pending.status === "email-in-use") fail("CONFLICT", EMAIL_IN_USE);
	if (pending.status !== "pin") {
		fail("UNAUTHORIZED", "Choose Google again to continue.");
	}

	const { account, identity } = pending;

	await verifyAccountPin(account.id, pin, MESSAGES.wrongPin);
	await attachGoogleId(account.id, identity);

	const session = await startSession(account.id);
	await forgetGoogleIdentity();

	return session;
}
