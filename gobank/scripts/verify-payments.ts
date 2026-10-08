// Payment checks use temporary users and billers, removed after every result.
import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { db } from "../src/server/db";
import { AppError, MESSAGES, asDatabaseError } from "../src/server/errors";
import {
	MAX_BALANCE_CENTAVOS,
	MAX_REWARD_POINTS,
} from "../src/shared/lib/money";
import { listBillers, payBill } from "../src/features/bills/bills.service";
import { buyLoad, deposit } from "../src/features/wallet/wallet.service";
import { redeemPoints } from "../src/features/rewards/rewards.service";
import { sendMoney } from "../src/features/transfers/transfers.service";
import {
	getTransaction,
	listActivity,
} from "../src/features/account/account.service";

const suffix = randomUUID().replaceAll("-", "");
const users: { id: string; username: string }[] = [];
const billers: string[] = [];
const rejection = (message: string) => (error: unknown) =>
	error instanceof AppError && error.message === message;
const account = (id: string) =>
	db.user.findUniqueOrThrow({
		where: { id },
		select: { balance: true, points: true },
	});
const transactionCount = (userId: string) =>
	db.transaction.count({ where: { userId } });

try {
	for (let i = 0; i < 3; i++) {
		const user = await db.user.create({
			data: {
				username: `payment_test_${suffix}_${i}`,
				fullName: "Payment Fixture",
				accountNumber: `payment-fixture-${suffix}-${i}`,
				pinHash: "test-only-not-a-valid-pin",
				balance: i === 1 ? MAX_BALANCE_CENTAVOS - 5 : 0,
				points: i === 2 ? MAX_REWARD_POINTS : 500,
				card: {
					create: {
						number: `payment-card-${suffix}-${i}`,
						expiresAt: new Date("2030-01-01"),
					},
				},
			},
			select: { id: true, username: true },
		});
		users.push(user);
	}
	for (const active of [true, false]) {
		const biller = await db.biller.create({
			data: {
				code: `payment-${suffix}-${active}`,
				name: "Payment Fixture",
				category: "internet",
				description: "Integration fixture",
				active,
			},
			select: { id: true },
		});
		billers.push(biller.id);
	}
	const payer = users[0]!;
	const fullAccount = users[1]!;
	const fullPoints = users[2]!;
	const activeBiller = billers[0]!;
	const inactiveBiller = billers[1]!;
	const availableBillers = await listBillers();
	assert.ok(availableBillers.some((biller) => biller.id === activeBiller));
	assert.ok(!availableBillers.some((biller) => biller.id === inactiveBiller));

	await deposit(payer.id, 50_000);
	const bill = await payBill(payer.id, activeBiller, "00112233", 5_000);
	assert.equal(bill.kind, "bill");
	assert.equal(bill.amount, -5_000);
	assert.equal(bill.billerId, activeBiller);
	assert.deepEqual(bill.details, { accountNumber: "00112233" });
	const load = await buyLoad(payer.id, "09123456789", 10_000);
	assert.equal(load.kind, "load");
	assert.equal(load.amount, -10_000);
	assert.deepEqual(load.details, { mobile: "09123456789" });
	assert.deepEqual(await account(payer.id), { balance: 35_000, points: 503 });
	const reward = await redeemPoints(payer.id, 100);
	assert.equal(reward.kind, "reward");
	assert.equal(reward.amount, 100);
	assert.equal(reward.points, -100);
	assert.deepEqual(await account(payer.id), { balance: 35_100, points: 403 });
	const redemptions = await Promise.allSettled([
		redeemPoints(payer.id, 300),
		redeemPoints(payer.id, 300),
	]);
	assert.equal(
		redemptions.filter((result) => result.status === "fulfilled").length,
		1,
	);
	const failedRedemption = redemptions.find(
		(result) => result.status === "rejected",
	);
	assert.ok(
		failedRedemption?.status === "rejected" &&
			rejection(MESSAGES.notEnoughPoints)(failedRedemption.reason),
	);
	assert.deepEqual(await account(payer.id), { balance: 35_400, points: 103 });
	assert.equal(
		await db.transaction.count({ where: { userId: payer.id, kind: "reward" } }),
		2,
	);

	const payerBefore = await account(payer.id);
	const countBefore = await transactionCount(payer.id);
	await assert.rejects(
		payBill(payer.id, inactiveBiller, "00112233", 5_000),
		(error: unknown) => asDatabaseError(error)?.code === "P2025",
	);
	await db.card.update({ where: { userId: payer.id }, data: { locked: true } });
	await assert.rejects(
		payBill(payer.id, activeBiller, "00112233", 5_000),
		rejection(MESSAGES.cardLocked),
	);
	assert.deepEqual(await account(payer.id), payerBefore);
	assert.equal(await transactionCount(payer.id), countBefore);
	await db.card.update({
		where: { userId: payer.id },
		data: { locked: false },
	});

	const credits = await Promise.allSettled([
		deposit(fullAccount.id, 5),
		deposit(fullAccount.id, 5),
	]);
	assert.equal(
		credits.filter((result) => result.status === "fulfilled").length,
		1,
	);
	const failedCredit = credits.find((result) => result.status === "rejected");
	assert.ok(
		failedCredit?.status === "rejected" &&
			rejection(MESSAGES.accountLimit)(failedCredit.reason),
	);
	assert.deepEqual(await account(fullAccount.id), {
		balance: MAX_BALANCE_CENTAVOS,
		points: 500,
	});
	assert.equal(await transactionCount(fullAccount.id), 1);
	await assert.rejects(
		redeemPoints(fullAccount.id, 100),
		rejection(MESSAGES.accountLimit),
	);
	await assert.rejects(
		sendMoney(payer.id, `@${fullAccount.username}`, 1, null),
		rejection(MESSAGES.accountLimit),
	);
	assert.deepEqual(await account(payer.id), payerBefore);
	assert.equal(await transactionCount(payer.id), countBefore);
	assert.deepEqual(await account(fullAccount.id), {
		balance: MAX_BALANCE_CENTAVOS,
		points: 500,
	});
	assert.equal(await transactionCount(fullAccount.id), 1);

	await deposit(fullPoints.id, 10_000);
	await assert.rejects(
		buyLoad(fullPoints.id, "09123456789", 5_000),
		rejection(MESSAGES.accountLimit),
	);
	assert.deepEqual(await account(fullPoints.id), {
		balance: 10_000,
		points: MAX_REWARD_POINTS,
	});
	assert.equal(await transactionCount(fullPoints.id), 1);

	const receipt = await getTransaction(payer.id, bill.reference);
	assert.equal(receipt.id, bill.id);
	assert.equal(receipt.reference, bill.reference);
	assert.equal(receipt.balanceAfter, bill.balanceAfter);
	assert.equal(receipt.biller?.name, "Payment Fixture");
	await assert.rejects(
		getTransaction(fullAccount.id, bill.reference),
		(error: unknown) => asDatabaseError(error)?.code === "P2025",
	);

	// Equal fixture timestamps also check stable ordering between pages.
	const historyStart = Date.now();
	const historyBalance = (await account(payer.id)).balance;
	await db.$transaction([
		db.user.update({
			where: { id: payer.id },
			data: { balance: { increment: 23 } },
		}),
		db.transaction.createMany({
			data: Array.from({ length: 23 }, (_, index) => ({
				userId: payer.id,
				kind: "deposit" as const,
				title: "Activity fixture",
				amount: 1,
				balanceAfter: historyBalance + index + 1,
				reference: `history-${suffix}-${index}`,
				createdAt: new Date(historyStart + Math.floor(index / 3)),
			})),
		}),
	]);
	const expected = await db.transaction.findMany({
		where: { userId: payer.id },
		select: { id: true },
		orderBy: [{ createdAt: "desc" }, { id: "desc" }],
	});
	const activityIds: string[] = [];
	const cursors = new Set<string>();
	let cursor: string | null | undefined = null;
	do {
		const page = await listActivity(payer.id, cursor, 5);
		assert.ok(page.items.length <= 5);
		activityIds.push(...page.items.map((entry) => entry.id));
		cursor = page.next;
		if (cursor) {
			assert.ok(!cursors.has(cursor), "Activity cursor must advance");
			cursors.add(cursor);
		}
	} while (cursor);
	assert.deepEqual(
		activityIds,
		expected.map((entry) => entry.id),
	);
	assert.equal(new Set(activityIds).size, expected.length);
	console.log(
		"Payment integration passed: bill/load ledger and points, concurrent redemption, locked cards, credit limits, incoming-transfer rollback, point overflow, paginated activity without skips or duplicates, and receipt ownership.",
	);
} finally {
	if (users.length)
		await db.user.deleteMany({
			where: { id: { in: users.map((user) => user.id) } },
		});
	if (billers.length)
		await db.biller.deleteMany({ where: { id: { in: billers } } });
	await db.$disconnect();
}
