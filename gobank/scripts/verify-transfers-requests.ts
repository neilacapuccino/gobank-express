// All balances and requests belong to temporary fixtures removed in finally.
import "dotenv/config";
import assert from "node:assert/strict";
import { randomInt, randomUUID } from "node:crypto";
import { db } from "../src/server/db";
import { AppError, MESSAGES } from "../src/server/errors";
import { post } from "../src/server/ledger";
import {
	findRecipient,
	getRecentRecipients,
	sendMoney,
} from "../src/features/transfers/transfers.service";
import {
	cancelRequest,
	listRequests,
	requestMoney,
	respondToRequest,
} from "../src/features/requests/requests.service";

const suffix = randomUUID().replaceAll("-", "");
const fixtures: {
	id: string;
	username: string;
	accountNumber: string;
	mobile: string;
}[] = [];
const rejection = (message: string) => (error: unknown) =>
	error instanceof AppError && error.message === message;
const balance = async (id: string) =>
	(
		await db.user.findUniqueOrThrow({
			where: { id },
			select: { balance: true },
		})
	).balance;
const funding = (userId: string, amount: number) =>
	db.$transaction((tx) =>
		post(tx, {
			userId,
			kind: "deposit",
			title: "Transfer test funding",
			amount,
		}),
	);

const pendingRequests = async (userId: string) =>
	(await listRequests(userId)).filter(
		(request) => request.payerId === userId && request.status === "pending",
	);

try {
	for (let i = 0; i < 9; i++) {
		const mobile = `09${randomInt(1_000_000_000).toString().padStart(9, "0")}`;
		const user = await db.user.create({
			data: {
				username: `transfer_test_${suffix}_${i}`,
				fullName: "Transfer Fixture",
				accountNumber: `20${randomInt(1_000_000_000).toString().padStart(9, "0")}`,
				mobile,
				pinHash: "test-only-not-a-valid-pin",
				card: {
					create: {
						number: `fixture-${suffix}-${i}`,
						expiresAt: new Date("2030-01-01"),
					},
				},
			},
			select: { id: true, username: true, accountNumber: true },
		});
		fixtures.push({ ...user, mobile });
	}
	const payer = fixtures[0]!;
	const requester = fixtures[1]!;
	const outsider = fixtures[2]!;
	await funding(payer.id, 1_000_000);
	for (const handle of [
		` @${requester.username.toUpperCase()} `,
		requester.accountNumber,
		`+63${requester.mobile.slice(1)}`,
	]) {
		assert.equal((await findRecipient(handle, payer.id)).id, requester.id);
	}
	await assert.rejects(
		findRecipient(`@${payer.username}`, payer.id),
		rejection(MESSAGES.ownAccount),
	);
	await assert.rejects(
		findRecipient(`stranger_${requester.mobile}`, payer.id),
		rejection(MESSAGES.recipientNotFound),
	);
	await assert.rejects(
		findRecipient(`@${requester.accountNumber}`, payer.id),
		rejection(MESSAGES.recipientNotFound),
	);
	const gmail = `fixture.${suffix}@gmail.com`;
	await db.user.update({ where: { id: requester.id }, data: { gmail } });
	await assert.rejects(
		findRecipient(gmail, payer.id),
		rejection(MESSAGES.recipientNotFound),
	);
	await db.user.update({
		where: { id: requester.id },
		data: { googleId: `fixture-${suffix}` },
	});
	assert.equal((await findRecipient(gmail, payer.id)).id, requester.id);

	const sent = await sendMoney(
		payer.id,
		`@${requester.username}`,
		12_345,
		"Fixture transfer",
	);
	const entries = await db.transaction.findMany({
		where: { reference: sent.reference },
	});
	assert.equal(entries.length, 2);
	assert.equal(
		entries.find((entry) => entry.userId === payer.id)?.amount,
		-12_345,
	);
	assert.equal(
		entries.find((entry) => entry.userId === requester.id)?.amount,
		12_345,
	);
	assert.equal(await balance(payer.id), 1_000_000 - 12_345);
	assert.equal(await balance(requester.id), 12_345);
	assert.deepEqual(sent.details, { note: "Fixture transfer" });
	await assert.rejects(
		sendMoney(outsider.id, `@${payer.username}`, 1, null),
		rejection(MESSAGES.insufficientBalance),
	);
	assert.equal(await balance(outsider.id), 0);
	for (const recipient of fixtures.slice(2)) {
		await sendMoney(payer.id, `@${recipient.username}`, 100, null);
	}
	await sendMoney(payer.id, `@${fixtures[8]!.username}`, 100, null);
	const recent = await getRecentRecipients(payer.id);
	assert.equal(recent.length, 6);
	assert.equal(new Set(recent.map((recipient) => recipient.id)).size, 6);
	assert.equal(recent[0]?.id, fixtures[8]!.id);
	assert.ok(
		recent.every((recipient) => Object.hasOwn(recipient, "profilePhoto")),
	);
	assert.deepEqual(await getRecentRecipients(requester.id), []);

	const request = await requestMoney(
		requester.id,
		`@${payer.username}`,
		25_000,
		"Fixture request",
	);
	assert.equal((await pendingRequests(payer.id))[0]?.id, request.id);
	assert.equal((await listRequests(requester.id))[0]?.id, request.id);
	await assert.rejects(
		respondToRequest(outsider.id, request.id, true),
		rejection(MESSAGES.requestClosed),
	);
	await assert.rejects(
		cancelRequest(outsider.id, request.id),
		rejection(MESSAGES.requestClosed),
	);
	const before = await balance(payer.id);
	const responses = await Promise.allSettled([
		respondToRequest(payer.id, request.id, true),
		respondToRequest(payer.id, request.id, true),
	]);
	assert.equal(
		responses.filter((result) => result.status === "fulfilled").length,
		1,
	);
	const paid = await db.moneyRequest.findUniqueOrThrow({
		where: { id: request.id },
	});
	assert.equal(paid.status, "paid");
	assert.ok(paid.reference);
	assert.equal(
		await db.transaction.count({ where: { reference: paid.reference } }),
		2,
	);
	assert.equal(await balance(payer.id), before - request.amount);
	await assert.rejects(
		respondToRequest(payer.id, request.id, true),
		rejection(MESSAGES.requestClosed),
	);
	await assert.rejects(
		cancelRequest(requester.id, request.id),
		rejection(MESSAGES.requestClosed),
	);

	const tooMuch = await requestMoney(
		requester.id,
		`@${payer.username}`,
		(await balance(payer.id)) + 1,
		null,
	);
	await assert.rejects(
		respondToRequest(payer.id, tooMuch.id, true),
		rejection(MESSAGES.insufficientBalance),
	);
	assert.equal(
		(await db.moneyRequest.findUniqueOrThrow({ where: { id: tooMuch.id } }))
			.status,
		"pending",
	);
	assert.equal(await balance(payer.id), before - request.amount);
	await cancelRequest(requester.id, tooMuch.id);

	const declined = await requestMoney(
		requester.id,
		`@${payer.username}`,
		100,
		null,
	);
	assert.equal(await respondToRequest(payer.id, declined.id, false), null);
	assert.equal(
		(await db.moneyRequest.findUniqueOrThrow({ where: { id: declined.id } }))
			.status,
		"declined",
	);
	assert.equal(await balance(payer.id), before - request.amount);
	const contested = await requestMoney(
		requester.id,
		`@${payer.username}`,
		200,
		null,
	);
	const contestedBefore = await balance(payer.id);
	const decisions = await Promise.allSettled([
		respondToRequest(payer.id, contested.id, true),
		cancelRequest(requester.id, contested.id),
	]);
	assert.equal(
		decisions.filter((result) => result.status === "fulfilled").length,
		1,
	);
	const resolved = await db.moneyRequest.findUniqueOrThrow({
		where: { id: contested.id },
	});
	assert.ok(resolved.status === "paid" || resolved.status === "cancelled");
	assert.equal(
		await balance(payer.id),
		contestedBefore - (resolved.status === "paid" ? 200 : 0),
	);
	assert.equal((await pendingRequests(payer.id)).length, 0);

	const limited = fixtures[8]!;
	await funding(limited.id, 10_000);
	await db.card.update({
		where: { userId: limited.id },
		data: { dailyLimit: 3_000 },
	});
	const limitedBefore = await balance(limited.id);
	const spends = await Promise.allSettled([
		sendMoney(limited.id, `@${requester.username}`, 2_000, null),
		sendMoney(limited.id, `@${outsider.username}`, 2_000, null),
	]);
	assert.equal(
		spends.filter((result) => result.status === "fulfilled").length,
		1,
	);
	assert.equal(await balance(limited.id), limitedBefore - 2_000);
	const failedSpend = spends.find((result) => result.status === "rejected");
	assert.ok(
		failedSpend?.status === "rejected" &&
			rejection(MESSAGES.overDailyLimit)(failedSpend.reason),
	);
	await db.card.update({
		where: { userId: limited.id },
		data: { locked: true },
	});
	await assert.rejects(
		sendMoney(limited.id, `@${requester.username}`, 1, null),
		rejection(MESSAGES.cardLocked),
	);

	const left = fixtures[6]!;
	const right = fixtures[7]!;
	await funding(left.id, 10_000);
	await funding(right.id, 10_000);
	const balancesBefore = [await balance(left.id), await balance(right.id)];
	await Promise.all([
		sendMoney(left.id, `@${right.username}`, 2_000, null),
		sendMoney(right.id, `@${left.username}`, 2_000, null),
	]);
	assert.deepEqual(
		[await balance(left.id), await balance(right.id)],
		balancesBefore,
	);
	console.log(
		"Transfer/request integration passed: recipient aliases, verified Gmail, balanced ledger, recent recipients, ownership, concurrent request actions, failed-payment rollback, locked cards, concurrent daily limits, and opposite transfers.",
	);
} finally {
	if (fixtures.length)
		await db.user.deleteMany({
			where: { id: { in: fixtures.map((user) => user.id) } },
		});
	await db.$disconnect();
}
