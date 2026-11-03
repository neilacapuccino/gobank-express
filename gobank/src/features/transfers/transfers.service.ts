import { normalizeGmail, normalizeMobile } from "~/shared/lib/contact";
import { db } from "~/server/db";
import { fail, MESSAGES } from "~/server/errors";
import { transfer } from "~/server/ledger";
import type { CardKind } from "../../../generated/prisma";

export const PARTY = {
	id: true,
	username: true,
	fullName: true,
	profilePhoto: true,
} as const;

const LOOKS_LIKE_PHONE = /^[+()\d\s-]+$/;
const PH_MOBILE = /^09\d{9}$/;

function recipientSearch(handle: string) {
	const input = handle.trim().toLowerCase();
	const value = input.replace(/^@/, "");

	if (input.startsWith("@")) return { username: value };

	const gmail = normalizeGmail(value);
	const mobile = LOOKS_LIKE_PHONE.test(value) ? normalizeMobile(value) : null;

	const byGmail = gmail ? [{ gmail, googleId: { not: null } }] : [];
	const byMobile = mobile && PH_MOBILE.test(mobile) ? [{ mobile }] : [];

	return {
		OR: [
			{ accountNumber: value.replace(/[\s-]/g, "") },
			{ username: value },
			...byGmail,
			...byMobile,
		],
	};
}

export async function findRecipient(handle: string, self: string) {
	const user = await db.user.findFirst({
		where: recipientSearch(handle),
		select: PARTY,
	});

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
	if (ids.length === 0) return [];
	const recipients = await db.user.findMany({
		where: { id: { in: ids } },
		select: PARTY,
	});
	const ordered = ids.map((id) =>
		recipients.find((recipient) => recipient.id === id),
	);
	return ordered.filter((recipient) => recipient !== undefined);
}

export async function sendMoney(
	userId: string,
	to: string,
	amount: number,
	note: string | null,
	card: CardKind,
) {
	const receiver = await findRecipient(to, userId);

	const sender = await db.user.findUniqueOrThrow({
		where: { id: userId },
		select: { id: true, username: true },
	});

	return db.$transaction((tx) =>
		transfer(tx, sender, receiver, amount, card, note),
	);
}
