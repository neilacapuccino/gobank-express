import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { db } from "../src/server/db";
import { AppError, MESSAGES } from "../src/server/errors";
import { newAccountNumber } from "../src/server/identifiers";
import { deleteAccount } from "../src/features/account/account.service";
import { MAX_PIN_ATTEMPTS } from "../src/features/auth/auth.rules";
import { hashPin } from "../src/features/auth/pin";
import { newCardCredentials } from "../src/features/card/card-credentials.server";

const PIN = "246802";
const suffix = randomUUID().replaceAll("-", "").slice(0, 10);
const createdUsers: string[] = [];

async function ownedCounts(userId: string) {
	const [users, cards, sessions, savingsGoals, transactions, requests, trades] =
		await Promise.all([
			db.user.count({ where: { id: userId } }),
			db.card.count({ where: { userId } }),
			db.session.count({ where: { userId } }),
			db.savingsGoal.count({ where: { userId } }),
			db.transaction.count({ where: { userId } }),
			db.moneyRequest.count({
				where: { OR: [{ requesterId: userId }, { payerId: userId }] },
			}),
			db.bitcoinTrade.count({ where: { userId } }),
		]);
	return {
		users,
		cards,
		sessions,
		savingsGoals,
		transactions,
		requests,
		trades,
	};
}

function failsWith(code: AppError["code"], message?: string) {
	return (error: unknown) =>
		error instanceof AppError &&
		error.code === code &&
		(message === undefined || error.message === message);
}

async function createFixture(username: string, pinHash: string) {
	const physical = newCardCredentials("visa");
	const virtual = newCardCredentials("mastercard", physical.cvv);
	const user = await db.user.create({
		data: {
			username,
			fullName: "Account deletion fixture",
			pinHash,
			accountNumber: newAccountNumber(),
			balance: 123_456,
			points: 42,
			cards: {
				create: [
					{ ...physical.card, kind: "physical" },
					{ ...virtual.card, kind: "virtual" },
				],
			},
			sessions: {
				create: [
					{ id: randomUUID(), expiresAt: new Date(Date.now() + 60_000) },
					{ id: randomUUID(), expiresAt: new Date(Date.now() + 120_000) },
				],
			},
			savingsGoals: { create: { name: "Deletion fixture", balance: 5_000 } },
			bitcoinTrades: {
				create: {
					submissionId: randomUUID(),
					action: "buy",
					bitcoinUnits: 1_000n,
					amountCentavos: 1_000,
					unitPriceCentavos: 100_000_000,
				},
			},
		},
		include: { savingsGoals: true },
	});
	createdUsers.push(user.id);
	return user;
}

try {
	const pinHash = await hashPin(PIN);
	const owner = await createFixture(`delete_${suffix}_a`, pinHash);
	const other = await createFixture(`delete_${suffix}_b`, pinHash);
	const identity = {
		username: owner.username,
		accountNumber: owner.accountNumber,
		gmail: `delete.${suffix}@gmail.com`,
		googleId: `delete_google_${suffix}`,
		mobile: `09${BigInt(`0x${suffix}`).toString().slice(0, 9).padStart(9, "0")}`,
	};
	await db.user.update({
		where: { id: owner.id },
		data: { ...identity, profilePhoto: "data:image/webp;base64,fixture" },
	});

	const reference = `delete_${randomUUID()}`;
	await db.transaction.create({
		data: {
			reference,
			kind: "transfer",
			title: "Deletion fixture transfer",
			amount: -1_000,
			balanceAfter: owner.balance,
			userId: owner.id,
			counterpartyId: other.id,
		},
	});
	const otherTransaction = await db.transaction.create({
		data: {
			reference,
			kind: "transfer",
			title: "Deletion fixture transfer",
			amount: 1_000,
			balanceAfter: other.balance,
			userId: other.id,
			counterpartyId: owner.id,
		},
	});
	await db.transaction.create({
		data: {
			reference: `delete_${randomUUID()}`,
			kind: "stash",
			title: "Deletion fixture savings",
			amount: -5_000,
			balanceAfter: owner.balance,
			userId: owner.id,
			savingsGoalId: owner.savingsGoals[0]!.id,
		},
	});
	await db.moneyRequest.createMany({
		data: [
			{ requesterId: owner.id, payerId: other.id, amount: 100 },
			{ requesterId: other.id, payerId: owner.id, amount: 200 },
		],
	});

	const before = await ownedCounts(owner.id);
	assert.deepEqual(before, {
		users: 1,
		cards: 2,
		sessions: 2,
		savingsGoals: 1,
		transactions: 2,
		requests: 2,
		trades: 1,
	});
	await assert.rejects(
		deleteAccount(owner.id, "000000"),
		failsWith("UNAUTHORIZED", MESSAGES.wrongPin),
	);
	assert.deepEqual(await ownedCounts(owner.id), before);
	assert.equal(
		(await db.user.findUniqueOrThrow({ where: { id: owner.id } }))
			.failedPinAttempts,
		1,
	);

	for (let attempt = 1; attempt < MAX_PIN_ATTEMPTS; attempt += 1) {
		await assert.rejects(
			deleteAccount(owner.id, "000000"),
			failsWith(
				attempt === MAX_PIN_ATTEMPTS - 1 ? "TOO_MANY_REQUESTS" : "UNAUTHORIZED",
			),
		);
	}
	await assert.rejects(
		deleteAccount(owner.id, PIN),
		failsWith("TOO_MANY_REQUESTS"),
	);
	assert.deepEqual(await ownedCounts(owner.id), before);
	await db.user.update({
		where: { id: owner.id },
		data: { lockedUntil: new Date(Date.now() - 1_000) },
	});

	const otherBefore = await db.user.findUniqueOrThrow({
		where: { id: other.id },
	});
	await deleteAccount(owner.id, PIN);
	assert.deepEqual(await ownedCounts(owner.id), {
		users: 0,
		cards: 0,
		sessions: 0,
		savingsGoals: 0,
		transactions: 0,
		requests: 0,
		trades: 0,
	});
	assert.deepEqual(
		await db.user.findUniqueOrThrow({ where: { id: other.id } }),
		otherBefore,
	);
	assert.deepEqual(await ownedCounts(other.id), {
		users: 1,
		cards: 2,
		sessions: 2,
		savingsGoals: 1,
		transactions: 1,
		requests: 0,
		trades: 1,
	});
	assert.deepEqual(
		await db.transaction.findUniqueOrThrow({
			where: { id: otherTransaction.id },
		}),
		{ ...otherTransaction, counterpartyId: null },
	);
	assert.equal(
		await db.user.findUnique({ where: { googleId: identity.googleId } }),
		null,
	);
	assert.equal(
		await db.user.findUnique({ where: { gmail: identity.gmail } }),
		null,
	);

	const replacement = await db.user.create({
		data: { ...identity, fullName: "Reused deletion fixture", pinHash },
		select: { id: true },
	});
	createdUsers.push(replacement.id);
	assert.notEqual(replacement.id, owner.id);

	console.log(
		"Passed: wrong-PIN protection, PIN lockout, permanent account deletion, all dependent rows removed, other account and history preserved, and identity reuse.",
	);
} finally {
	try {
		await db.user.deleteMany({ where: { id: { in: createdUsers } } });
	} finally {
		await db.$disconnect();
	}
}
