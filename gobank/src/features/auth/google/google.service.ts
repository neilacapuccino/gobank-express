import { db } from "~/server/db";
import { startSession } from "~/server/session";
import { normalizeGmail } from "~/shared/lib/contact";
import { rememberGoogleIdentity } from "./google-identity.server";
import type { GoogleProfile } from "./google.server";

export async function signInWithGoogle(profile: GoogleProfile) {
	const known = await db.user.findUnique({
		where: { googleId: profile.sub },
		select: { id: true },
	});
	if (known) {
		const session = await startSession(known.id);
		return { status: "signed-in" as const, ...session };
	}

	const gmail = profile.email ? normalizeGmail(profile.email) : null;
	if (gmail) {
		const taken = await db.user.findUnique({
			where: { gmail },
			select: { id: true },
		});
		if (taken) return { status: "email-in-use" as const };
	}

	await rememberGoogleIdentity({ sub: profile.sub, gmail, name: profile.name });
	return { status: "register" as const };
}
