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
	requestMoney,
	respondToRequest,
} from "../src/features/requests/requests.service";
import { listNotifications } from "../src/features/notifications/notifications.service";

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
	(await listNotifications(userId, "received")).items.filter(
		(request) => request.status === "pending",
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
				cards: {
					create: {
						kind: "physical",
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
	assert.equal(
		(await listNotifications(requester.id, "sent")).items[0]?.id,
		request.id,
	);
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
	await db.user.update({
		where: { id: limited.id },
		data: { cardDailyLimit: 3_000 },
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
	const overLimitRequest = await requestMoney(
		requester.id,
		`@${limited.username}`,
		1_001,
		null,
	);
	const requestBalance = await balance(limited.id);
	const requestEntries = await db.transaction.count({
		where: { userId: limited.id },
	});
	await assert.rejects(
		respondToRequest(limited.id, overLimitRequest.id, true),
		rejection(MESSAGES.overDailyLimit),
	);
	assert.equal(
		(
			await db.moneyRequest.findUniqueOrThrow({
				where: { id: overLimitRequest.id },
			})
		).status,
		"pending",
	);
	await db.user.update({
		where: { id: limited.id },
		data: { cardLocked: true },
	});
	await assert.rejects(
		sendMoney(limited.id, `@${requester.username}`, 1, null),
		rejection(MESSAGES.cardLocked),
	);
	const lockedRequest = await requestMoney(
		requester.id,
		`@${limited.username}`,
		1,
		null,
	);
	await assert.rejects(
		respondToRequest(limited.id, lockedRequest.id, true),
		rejection(MESSAGES.cardLocked),
	);
	assert.equal(
		(
			await db.moneyRequest.findUniqueOrThrow({
				where: { id: lockedRequest.id },
			})
		).status,
		"pending",
	);
	assert.equal(await balance(limited.id), requestBalance);
	assert.equal(
		await db.transaction.count({ where: { userId: limited.id } }),
		requestEntries,
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

	const outgoingRequest = await requestMoney(
		payer.id,
		`@${requester.username}`,
		100,
		null,
	);
	await respondToRequest(requester.id, outgoingRequest.id, true);
	const fixturePhoto =
		"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/6i5xyoAAAAASUVORK5CYII=";
	await db.user.updateMany({
		where: { id: { in: [payer.id, requester.id] } },
		data: { profilePhoto: fixturePhoto },
	});
	const directions = ["received", "sent"] as const;
	const statuses = ["pending", "declined", "cancelled"] as const;
	const historyStart = Date.now();
	for (const direction of directions) {
		await db.moneyRequest.createMany({
			data: Array.from({ length: 26 }, (_, index) => ({
				requesterId: direction === "received" ? requester.id : payer.id,
				payerId: direction === "received" ? payer.id : requester.id,
				amount: 100,
				note: "Request history fixture",
				status: statuses[index % statuses.length]!,
				createdAt: new Date(historyStart + Math.floor(index / 3)),
			})),
		});
	}
	const foreign = await db.moneyRequest.create({
		data: {
			requesterId: fixtures[3]!.id,
			payerId: fixtures[4]!.id,
			amount: 100,
			createdAt: new Date(historyStart + 100),
		},
	});
	for (const direction of directions) {
		const where =
			direction === "received"
				? { payerId: payer.id }
				: { requesterId: payer.id };
		const expected = await db.moneyRequest.findMany({
			where,
			select: { id: true },
			orderBy: [{ createdAt: "desc" }, { id: "desc" }],
		});
		const ids: string[] = [];
		const seenCursors = new Set<string>();
		const seenStatuses = new Set<string>();
		let cursor: string | null = null;
		do {
			const page = await listNotifications(payer.id, direction, cursor, 5);
			assert.ok(page.items.length <= 5);
			for (const item of page.items) {
				ids.push(item.id);
				seenStatuses.add(item.status);
				const self = direction === "received" ? item.payer : item.requester;
				const opposite = direction === "received" ? item.requester : item.payer;
				assert.equal(self.id, payer.id);
				assert.equal(self.profilePhoto, null);
				assert.equal(opposite.id, requester.id);
				assert.equal(opposite.profilePhoto, fixturePhoto);
			}
			cursor = page.next;
			if (cursor) {
				assert.ok(!seenCursors.has(cursor), "Request cursor must advance");
				seenCursors.add(cursor);
			}
		} while (cursor);
		assert.deepEqual(
			ids,
			expected.map((item) => item.id),
		);
		assert.equal(new Set(ids).size, expected.length);
		assert.deepEqual([...seenStatuses].sort(), [
			"cancelled",
			"declined",
			"paid",
			"pending",
		]);
		assert.ok(!ids.includes(foreign.id));
		assert.deepEqual(
			await listNotifications(payer.id, direction, foreign.id, 5),
			{
				items: [],
				next: null,
			},
		);
		const otherDirection = direction === "received" ? "sent" : "received";
		const otherPage = await listNotifications(
			payer.id,
			otherDirection,
			null,
			1,
		);
		assert.deepEqual(
			await listNotifications(payer.id, direction, otherPage.items[0]!.id, 5),
			{ items: [], next: null },
		);
	}
	assert.deepEqual(await listNotifications(outsider.id, "received"), {
		items: [],
		next: null,
	});
	assert.deepEqual(await listNotifications(outsider.id, "sent"), {
		items: [],
		next: null,
	});
	console.log(
		"Transfer/request integration passed: recipient aliases, balanced ledger, ownership, concurrent request actions, debit rollback, daily limits, opposite transfers, both paginated request directions without skips, all statuses, bounded photos, and foreign-cursor isolation.",
	);
} finally {
	if (fixtures.length)
		await db.user.deleteMany({
			where: { id: { in: fixtures.map((user) => user.id) } },
		});
	await db.$disconnect();
}
