import { normaliseGmail, normaliseMobile } from "~/shared/lib/contact";
import { db } from "~/server/db";
import { fail, MESSAGES } from "~/server/errors";
import { transfer } from "~/server/ledger";

export const PARTY = {
	id: true,
	username: true,
	fullName: true,
	profilePhoto: true,
} as const;

export async function findRecipient(handle: string, self: string) {
	const value = handle.trim().replace(/^@/, "").toLowerCase();
	const mobile = normaliseMobile(value);
	const gmail = normaliseGmail(value);

	const user = await db.user.findFirst({
		where: {
			OR: [
				{ accountNumber: value },
				{ username: value },
				...(gmail ? [{ gmail, googleId: { not: null } }] : []),
				...(mobile ? [{ mobile }] : []),
			],
		},
		select: PARTY,
	});

	if (!user) return fail("NOT_FOUND", MESSAGES.recipientNotFound);
	if (user.id === self) fail("BAD_REQUEST", MESSAGES.ownAccount);

	return user;
}

export async function getRecentRecipients(userId: string) {
	const transactions = await db.transaction.findMany({
		where: {
			userId,
			kind: "transfer",
			amount: { lt: 0 },
			counterpartyId: { not: null },
		},
		select: {
			counterparty: {
				select: PARTY,
			},
		},
		orderBy: {
			createdAt: "desc",
		},
		take: 50,
	});

	const seen = new Set<string>();

	return transactions
		.map((transaction) => transaction.counterparty)
		.filter((user): user is NonNullable<typeof user> => {
			if (!user || seen.has(user.id)) return false;

			seen.add(user.id);
			return true;
		})
		.slice(0, 6);
}

export async function sendMoney(
	userId: string,
	to: string,
	amount: number,
	note: string | null,
) {
	const receiver = await findRecipient(to, userId);

	const sender = await db.user.findUniqueOrThrow({
		where: { id: userId },
		select: PARTY,
	});

	return db.$transaction((tx) => transfer(tx, sender, receiver, amount, note));
}
