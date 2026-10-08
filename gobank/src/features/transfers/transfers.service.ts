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
	const input = handle.trim().toLowerCase();
	const value = input.replace(/^@/, "");
	const mobile = /^[+()\d\s-]+$/.test(value) ? normaliseMobile(value) : null;
	const gmail = normaliseGmail(value);
	const where = input.startsWith("@")
		? { username: value }
		: {
				OR: [
					{ accountNumber: value },
					{ username: value },
					...(gmail ? [{ gmail, googleId: { not: null } }] : []),
					...(mobile && /^09\d{9}$/.test(mobile) ? [{ mobile }] : []),
				],
			};
	const user = await db.user.findFirst({ where, select: PARTY });

	if (!user) return fail("NOT_FOUND", MESSAGES.recipientNotFound);
	if (user.id === self) fail("BAD_REQUEST", MESSAGES.ownAccount);

	return user;
}

export async function getRecentRecipients(userId: string) {
	const transactions = await db.transaction.groupBy({
		by: ["counterpartyId"],
		where: {
			userId,
			kind: "transfer",
			amount: { lt: 0 },
			counterpartyId: { not: null },
		},
		orderBy: { _max: { createdAt: "desc" } },
		take: 6,
	});

	const ids = transactions.flatMap((entry) =>
		entry.counterpartyId ? [entry.counterpartyId] : [],
	);
	const recipients = await db.user.findMany({
		where: { id: { in: ids } },
		select: PARTY,
	});
	return ids.flatMap((id) =>
		recipients.filter((recipient) => recipient.id === id),
	);
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
		select: { id: true, username: true },
	});

	return db.$transaction((tx) => transfer(tx, sender, receiver, amount, note));
}
