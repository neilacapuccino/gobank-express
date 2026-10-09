// Each check uses tracked temporary fixtures and removes them in finally.
import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { db } from "../src/server/db";
import { newAccountNumber } from "../src/server/codes";
import { AppError, MESSAGES, asDatabaseError } from "../src/server/errors";
import {
	createRegisteredAccount,
	verifyAccountPin,
} from "../src/features/auth/auth.service";
import {
	cardDraftId,
	createCardPreview,
} from "../src/features/auth/card-preview.service";
import { verifyPin } from "../src/features/auth/pin";
import {
	getOverview,
	getProfile,
	updateProfile,
} from "../src/features/account/account.service";
import {
	getCard,
	revealCvv,
	updateCard,
} from "../src/features/card/card.service";
import { getTransaction } from "../src/features/activity/activity.service";
import { deposit } from "../src/features/deposit/deposit.service";
import { buyLoad } from "../src/features/load/load.service";
import { payBill } from "../src/features/bills/bills.service";
import { sendMoney } from "../src/features/transfers/transfers.service";
import {
	cancelRequest,
	requestMoney,
	respondToRequest,
} from "../src/features/requests/requests.service";
import { listNotifications } from "../src/features/notifications/notifications.service";
import {
	createStash,
	getStash,
	moveMoney,
	removeStash,
} from "../src/features/stashes/stashes.service";

const suffix = randomUUID().replaceAll("-", "").slice(0, 10);
const users: string[] = [];
const drafts: string[] = [];
let billerId: string | undefined;
const rejectsMessage = (message: string) => (error: unknown) =>
	error instanceof AppError && error.message === message;
const balance = async (id: string) =>
	(
		await db.user.findUniqueOrThrow({
			where: { id },
			select: { balance: true },
		})
	).balance;

try {
	// Registration keeps the confirmed card and creates a separate virtual card.
	const registration = {
		username: `core_${suffix}_a`,
		fullName: "Core fixture",
		mobile: null,
		pin: "246802",
		brand: "visa" as const,
	};
	const prepared = await createCardPreview(registration.brand);
	drafts.push(cardDraftId(prepared.token));
	const owner = await createRegisteredAccount(registration, prepared.token);
	users.push(owner.id);
	const other = await db.user.create({
		data: {
			username: `core_${suffix}_b`,
			fullName: "Other fixture",
			accountNumber: newAccountNumber(),
			pinHash: "fixture-only",
		},
		select: { id: true, username: true },
	});
	users.push(other.id);
	const cards = await getCard(owner.id);
	assert.equal(cards.physical.number, prepared.preview.number);
	assert.notEqual(cards.physical.number, cards.virtual.number);
	assert.notEqual(cards.physical.brand, cards.virtual.brand);
	assert.equal(
		(await revealCvv(owner.id, "physical")).cvv,
		prepared.preview.cvv,
	);
	assert.notEqual(
		(await revealCvv(owner.id, "virtual")).cvv,
		prepared.preview.cvv,
	);
	assert.ok(!("cvvEncrypted" in cards.physical));
	const stored = await db.user.findUniqueOrThrow({ where: { id: owner.id } });
	assert.ok(await verifyPin(registration.pin, stored.pinHash));
	await assert.rejects(async () => {
		const replay = await createRegisteredAccount(
			{ ...registration, username: `core_${suffix}_c` },
			prepared.token,
		);
		users.push(replay.id);
	});
	await assert.rejects(
		verifyAccountPin(owner.id, "000000", MESSAGES.wrongPin),
		rejectsMessage(MESSAGES.wrongPin),
	);
	await verifyAccountPin(owner.id, registration.pin, MESSAGES.wrongPin);

	// Profile changes persist; an invalid photo cannot partially save the name.
	const photo = await sharp({
		create: { width: 8, height: 8, channels: 3, background: "#009b72" },
	})
		.png()
		.toBuffer();
	await updateProfile(owner.id, {
		fullName: "Saved fixture",
		mobile: null,
		profilePhoto: `data:image/png;base64,${photo.toString("base64")}`,
	});
	const profile = await getProfile(owner.id);
	assert.equal(profile.fullName, "Saved fixture");
	assert.match(profile.profilePhoto!, /^data:image\/webp;base64,/);
	await assert.rejects(
		updateProfile(owner.id, {
			fullName: "Must not save",
			mobile: null,
			profilePhoto: "data:image/png;base64,AAAA",
		}),
	);
	assert.deepEqual(await getProfile(owner.id), profile);
	assert.equal((await getProfile(other.id)).profilePhoto, null);

	// Payments update the ledger and rewards together, with owner-only receipts.
	const biller = await db.biller.create({
		data: {
			code: `core-${suffix}`,
			name: "Core biller",
			category: "internet",
			description: "Verification fixture",
		},
		select: { id: true },
	});
	billerId = biller.id;
	await deposit(owner.id, 100_000);
	const bill = await payBill(owner.id, biller.id, "00112233", 5_000);
	await buyLoad(owner.id, "09123456789", 10_000);
	assert.equal(await balance(owner.id), 85_000);
	assert.equal((await getOverview(owner.id)).points, 3);
	assert.equal((await getTransaction(owner.id, bill.reference)).id, bill.id);
	await assert.rejects(
		getTransaction(other.id, bill.reference),
		(error: unknown) => asDatabaseError(error)?.code === "P2025",
	);
	const beforeFailure = await getOverview(owner.id);
	await assert.rejects(
		buyLoad(owner.id, "09123456789", 100_000),
		rejectsMessage(MESSAGES.insufficientBalance),
	);
	assert.deepEqual(await getOverview(owner.id), beforeFailure);

	// Transfers balance both ledger entries; requests allow one authorized decision.
	const sent = await sendMoney(owner.id, `@${other.username}`, 12_345, null);
	const entries = await db.transaction.findMany({
		where: { reference: sent.reference },
	});
	assert.equal(entries.length, 2);
	assert.equal(
		entries.reduce((total, entry) => total + entry.amount, 0),
		0,
	);
	assert.equal(await balance(other.id), 12_345);
	const paid = await requestMoney(owner.id, other.username, 1_000, null);
	await assert.rejects(
		respondToRequest(owner.id, paid.id, true),
		rejectsMessage(MESSAGES.requestClosed),
	);
	await respondToRequest(other.id, paid.id, true);
	await assert.rejects(
		respondToRequest(other.id, paid.id, true),
		rejectsMessage(MESSAGES.requestClosed),
	);
	assert.equal(await balance(other.id), 11_345);
	const declined = await requestMoney(owner.id, other.username, 100, null);
	await respondToRequest(other.id, declined.id, false);
	const cancelled = await requestMoney(owner.id, other.username, 100, null);
	await cancelRequest(owner.id, cancelled.id);
	const notifications = await listNotifications(owner.id, "sent");
	assert.deepEqual(
		notifications.items.map((request) => request.status).sort(),
		["cancelled", "declined", "paid"],
	);
	assert.equal((await listNotifications(owner.id, "received")).items.length, 0);

	// Physical and virtual cards share account locks and spending limits.
	await updateCard(owner.id, { cardLocked: true });
	const locked = await getOverview(owner.id);
	await assert.rejects(
		sendMoney(owner.id, other.username, 100, null),
		rejectsMessage(MESSAGES.cardLocked),
	);
	assert.deepEqual(await getOverview(owner.id), locked);
	await updateCard(owner.id, { cardLocked: false, cardDailyLimit: 0 });
	await assert.rejects(
		buyLoad(owner.id, "09123456789", 1_000),
		rejectsMessage(MESSAGES.overDailyLimit),
	);

	// Interest stays in its savings goal, credits once, and returns on closure.
	const goal = await createStash(owner.id, "Core savings", 100_000);
	await moveMoney(owner.id, goal.id, 10_000, "in");
	const mainBalance = await balance(owner.id);
	await db.savingsGoal.update({
		where: { id: goal.id },
		data: { interestCalculatedAt: new Date(Date.now() - 365 * 86_400_000) },
	});
	const earned = await getStash(owner.id, goal.id);
	assert.ok(earned.balance > 10_400 && earned.balance < 10_420);
	assert.equal((await getStash(owner.id, goal.id)).balance, earned.balance);
	assert.equal(await balance(owner.id), mainBalance);
	await assert.rejects(getStash(other.id, goal.id));
	await assert.rejects(removeStash(other.id, goal.id));
	const closed = await removeStash(owner.id, goal.id);
	assert.equal(closed.returned, earned.balance);
	assert.equal(await balance(owner.id), mainBalance + closed.returned);
	assert.equal(
		await db.savingsGoal.findUnique({ where: { id: goal.id } }),
		null,
	);
	console.log(
		"Passed: registration, cards, PINs, profile, payments, transfers, requests, ownership, rollback and savings.",
	);
} finally {
	try {
		if (users.length)
			await db.user.deleteMany({ where: { id: { in: users } } });
	} finally {
		try {
			if (billerId) await db.biller.deleteMany({ where: { id: billerId } });
		} finally {
			try {
				if (drafts.length)
					await db.registrationCard.deleteMany({
						where: { id: { in: drafts } },
					});
			} finally {
				await db.$disconnect();
			}
		}
	}
}
