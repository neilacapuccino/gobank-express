import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { db } from "../src/server/db";
import { createRegisteredAccount } from "../src/features/auth/auth.service";
import {
	cardDraftId,
	createCardPreview,
} from "../src/features/auth/card-preview.service";
import { verifyPin } from "../src/features/auth/pin";
import { CARD_BRANDS } from "../src/features/card/card-brands";
import { getProfile } from "../src/features/account/account.service";
import { findRecipient } from "../src/features/transfers/transfers.service";
import {
	createStash,
	getStash,
	moveMoney,
	removeStash,
	updateStash,
} from "../src/features/stashes/stashes.service";
import { profileFields } from "../src/shared/lib/schemas";
import { z } from "zod";

const suffix = randomUUID().replaceAll("-", "");
const users: string[] = [];
const drafts: string[] = [];
const reserve = async (brand: (typeof CARD_BRANDS)[number]["id"]) => {
	const card = await createCardPreview(brand);
	drafts.push(cardDraftId(card.token));
	return card;
};

try {
	assert.equal(
		z.object(profileFields).safeParse({ fullName: "", mobile: "" }).success,
		false,
	);
	assert.equal(
		z.object(profileFields).safeParse({ fullName: "Test Member", mobile: "" })
			.success,
		true,
	);
	for (const brand of CARD_BRANDS) {
		const { token, preview } = await reserve(brand.id);
		assert.equal(preview.number.slice(0, 4), brand.numberPrefix);
		assert.equal(preview.number.length, 16);
		const user = await createRegisteredAccount(
			{
				username: `registration_${suffix}_${brand.id}`,
				fullName: "Registration Fixture",
				mobile: null,
				pin: "246802",
				brand: brand.id,
			},
			token,
		);
		users.push(user.id);
		const issued = await db.user.findUniqueOrThrow({
			where: { id: user.id },
			include: { card: true },
		});
		assert.equal(issued.card?.number, preview.number);
		assert.equal(issued.card?.expiresAt.toISOString(), preview.expiresAt);
		assert.ok(await verifyPin(preview.cvv, issued.card!.cvvHash!));
		assert.ok(await verifyPin("246802", issued.pinHash));
		assert.match(issued.card!.cvvHash!, /^[a-f0-9]{32}:[a-f0-9]{128}$/);
		assert.equal(
			await db.registrationCard.findUnique({
				where: { id: cardDraftId(token) },
			}),
			null,
		);
		await assert.rejects(
			createRegisteredAccount(
				{
					username: `replay_${suffix}`,
					fullName: "Replay Fixture",
					mobile: null,
					pin: "246802",
					brand: brand.id,
				},
				token,
			),
		);
	}
	const owner = users[0]!;
	const other = users[1]!;
	const rollback = await reserve("discover");
	const duplicate = await db.user.findUniqueOrThrow({
		where: { id: owner },
		select: { username: true },
	});
	await assert.rejects(
		createRegisteredAccount(
			{
				username: duplicate.username,
				fullName: "Duplicate Fixture",
				mobile: null,
				pin: "246802",
				brand: "discover",
			},
			rollback.token,
		),
	);
	assert.ok(
		await db.registrationCard.findUnique({
			where: { id: cardDraftId(rollback.token) },
		}),
	);
	await assert.rejects(
		createRegisteredAccount(
			{
				username: `mismatch_${suffix}`,
				fullName: "Mismatch Fixture",
				mobile: null,
				pin: "246802",
				brand: "visa",
			},
			rollback.token,
		),
	);
	await db.registrationCard.update({
		where: { id: cardDraftId(rollback.token) },
		data: { validUntil: new Date(0) },
	});
	await assert.rejects(
		createRegisteredAccount(
			{
				username: `expired_${suffix}`,
				fullName: "Expired Fixture",
				mobile: null,
				pin: "246802",
				brand: "discover",
			},
			rollback.token,
		),
	);

	const gmail = `fixture.${suffix}@gmail.com`;
	await db.user.update({ where: { id: owner }, data: { gmail } });
	assert.equal((await getProfile(owner)).gmail, null);
	await assert.rejects(findRecipient(gmail, other));
	await db.user.update({
		where: { id: owner },
		data: { googleId: `fixture-${suffix}` },
	});
	assert.equal((await getProfile(owner)).gmail, gmail);
	assert.equal((await findRecipient(gmail.toUpperCase(), other)).id, owner);
	await assert.rejects(findRecipient(gmail, owner));

	await db.user.update({ where: { id: owner }, data: { balance: 50_000 } });
	const goal = await createStash(owner, "Original goal", 200_000);
	await updateStash(owner, goal.id, { name: "Renamed goal" });
	assert.equal((await getStash(owner, goal.id)).name, "Renamed goal");
	await assert.rejects(
		updateStash(other, goal.id, { name: "Other user's edit" }),
	);
	await db.stash.update({
		where: { id: goal.id },
		data: {
			balance: 100_000,
			interestCarry: 0,
			interestUpdatedAt: new Date(Date.now() - 365 * 86_400_000),
		},
	});
	const earned = await getStash(owner, goal.id);
	assert.ok(earned.balance > 104_000 && earned.balance < 104_100);
	assert.equal(
		(await db.user.findUniqueOrThrow({ where: { id: owner } })).balance,
		50_000,
	);
	assert.equal(
		earned.transactions.filter((entry) => entry.kind === "interest").length,
		1,
	);
	const again = await getStash(owner, goal.id);
	assert.equal(again.balance, earned.balance);
	assert.equal(
		again.transactions.filter((entry) => entry.kind === "interest").length,
		1,
	);
	await assert.rejects(removeStash(other, goal.id));
	const closed = await removeStash(owner, goal.id);
	assert.equal(closed.returned, earned.balance);
	assert.equal(await db.stash.findUnique({ where: { id: goal.id } }), null);
	assert.equal(
		(await db.user.findUniqueOrThrow({ where: { id: owner } })).balance,
		50_000 + closed.returned,
	);
	assert.ok(
		await db.transaction.findFirst({
			where: {
				userId: owner,
				kind: "stash",
				amount: closed.returned,
				stashId: null,
			},
		}),
	);

	const race = await createStash(owner, "Close race");
	await db.stash.update({ where: { id: race.id }, data: { balance: 50_000 } });
	await db.user.update({ where: { id: owner }, data: { balance: 50_000 } });
	const outcomes = await Promise.allSettled([
		removeStash(owner, race.id),
		moveMoney(owner, race.id, 1_000, "in"),
	]);
	assert.equal(outcomes[0]!.status, "fulfilled");
	assert.equal(await db.stash.findUnique({ where: { id: race.id } }), null);
	assert.equal(
		(await db.user.findUniqueOrThrow({ where: { id: owner } })).balance,
		100_000,
	);
	for (let index = 1; index <= 4; index++)
		await createStash(other, `Limit fixture ${index}`);
	const limitRace = await Promise.allSettled([
		createStash(other, "Fifth goal A"),
		createStash(other, "Fifth goal B"),
	]);
	assert.equal(
		limitRace.filter((outcome) => outcome.status === "fulfilled").length,
		1,
	);
	assert.equal(await db.stash.count({ where: { userId: other } }), 5);
	console.log(
		"Passed: reserved card issuance, PIN/CVV hashes, replay/expiry/brand checks, rollback, required name, verified Gmail lookup, goal renaming, compound growth, repeat-credit prevention, atomic closure, concurrent deposit protection and the five-goal limit.",
	);
} finally {
	if (drafts.length)
		await db.registrationCard.deleteMany({ where: { id: { in: drafts } } });
	if (users.length) await db.user.deleteMany({ where: { id: { in: users } } });
	await db.$disconnect();
}
