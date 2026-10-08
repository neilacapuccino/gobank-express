import "dotenv/config";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { db } from "../src/server/db";
import { AppError } from "../src/server/errors";
import { createRegisteredAccount } from "../src/features/auth/auth.service";
import {
	cardDraftId,
	createCardPreview,
} from "../src/features/auth/card-preview.service";
import { hashPin, verifyPin } from "../src/features/auth/pin";
import { CARD_BRANDS } from "../src/features/card/card-brands";
import {
	getCard,
	revealCvv,
	updateCard,
} from "../src/features/card/card.service";
import {
	cardExpiry,
	newAccountNumber,
	newCardNumber,
	virtualCardBrand,
} from "../src/server/codes";

const suffix = randomUUID().replaceAll("-", "");
const users: string[] = [];
const drafts: string[] = [];
const reserve = async (brand: (typeof CARD_BRANDS)[number]["id"]) => {
	const prepared = await createCardPreview(brand);
	drafts.push(cardDraftId(prepared.token));
	return prepared;
};
const register = async (
	token: string,
	brand: (typeof CARD_BRANDS)[number]["id"],
) => {
	const user = await createRegisteredAccount(
		{
			username: `card_${suffix}_${users.length}`,
			fullName: "Card Fixture",
			mobile: null,
			pin: "246802",
			brand,
		},
		token,
	);
	users.push(user.id);
	return user.id;
};
const cardRows = (userId: string) =>
	db.card.findMany({ where: { userId }, orderBy: { kind: "asc" } });
const assertPublicCards = (cards: Awaited<ReturnType<typeof getCard>>) => {
	for (const card of [cards.physical, cards.virtual]) {
		assert.equal("cvvEncrypted" in card, false);
		assert.equal("cvvHash" in card, false);
		assert.equal("cvv" in card, false);
		assert.equal("locked" in card, false);
		assert.equal("dailyLimit" in card, false);
		assert.equal(card.hasCvv, true);
	}
	assert.equal(cards.physical.kind, "physical");
	assert.equal(cards.virtual.kind, "virtual");
	assert.notEqual(cards.physical.number, cards.virtual.number);
	assert.equal(cards.virtual.brand, virtualCardBrand(cards.physical.brand));
};
const withCardKey = (key: string, assertion: string) => {
	const script = `
		import assert from "node:assert/strict";
		import { getCard, revealCvv, updateCard } from "./src/features/card/card.service.ts";
		import { db } from "./src/server/db.ts";
		import { AppError } from "./src/server/errors.ts";
		try {
			${assertion}
		} finally { await db.$disconnect(); }
	`;
	const result = spawnSync(
		process.execPath,
		[
			"--conditions=react-server",
			"--import",
			"tsx",
			"--input-type=module",
			"--eval",
			script,
		],
		{
			cwd: process.cwd(),
			env: { ...process.env, CARD_ENCRYPTION_KEY: key },
			timeout: 60_000,
		},
	);
	assert.equal(result.status, 0, "Card encryption configuration check failed.");
};
const assertNoInitializationWithKey = (
	userId: string,
	key: string,
	changeSettings = false,
) =>
	withCardKey(
		key,
		`await assert.rejects(
			${changeSettings ? "updateCard" : "getCard"}(${JSON.stringify(userId)}${changeSettings ? ", { cardLocked: false, cardDailyLimit: 999_900 }" : ""}),
			error => error instanceof AppError && error.code === "BAD_REQUEST"
		);`,
	);

try {
	for (const brand of CARD_BRANDS) {
		const { token, preview } = await reserve(brand.id);
		const draft = await db.registrationCard.findUniqueOrThrow({
			where: { id: cardDraftId(token) },
		});
		const userId = await register(token, brand.id);
		const issued = await cardRows(userId);
		assert.equal(issued.length, 2);
		const physical = issued.find((card) => card.kind === "physical")!;
		const virtual = issued.find((card) => card.kind === "virtual")!;
		assert.equal(physical.number, preview.number);
		assert.equal(physical.expiresAt.toISOString(), preview.expiresAt);
		assert.equal(physical.cvvEncrypted, draft.cvvEncrypted);
		assert.ok(await verifyPin(preview.cvv, physical.cvvHash!));
		assert.equal((await revealCvv(userId, "physical")).cvv, preview.cvv);
		const virtualCvv = (await revealCvv(userId, "virtual")).cvv;
		assert.match(virtualCvv, /^\d{3}$/);
		assert.notEqual(virtualCvv, preview.cvv);
		assert.ok(await verifyPin(virtualCvv, virtual.cvvHash!));
		assert.equal(virtual.brand, virtualCardBrand(brand.id));
		assertPublicCards(await getCard(userId));
		const updated = await updateCard(userId, {
			cardLocked: true,
			cardDailyLimit: 100_000,
		});
		assertPublicCards(updated);
		assert.equal(updated.cardLocked, true);
		assert.equal(updated.cardDailyLimit, 100_000);
		await getCard(userId);
		assert.deepEqual(await cardRows(userId), issued);
		assert.equal(
			(await db.user.findUniqueOrThrow({ where: { id: userId } })).balance,
			0,
		);
	}

	// The existing physical PAN and encrypted CVV survive a missing virtual card.
	const owner = users[0]!;
	await db.card.delete({
		where: { userId_kind: { userId: owner, kind: "virtual" } },
	});
	const physicalBefore = await db.card.findUniqueOrThrow({
		where: { userId_kind: { userId: owner, kind: "physical" } },
	});
	assertNoInitializationWithKey(owner, randomBytes(32).toString("hex"));
	assert.deepEqual(await cardRows(owner), [physicalBefore]);
	const concurrent = await Promise.all(
		Array.from({ length: 6 }, () => getCard(owner)),
	);
	for (const result of concurrent) assertPublicCards(result);
	assert.ok(
		concurrent.every(
			(result) => result.virtual.number === concurrent[0]!.virtual.number,
		),
	);
	assert.equal(await db.card.count({ where: { userId: owner } }), 2);
	assert.deepEqual(
		await db.card.findUniqueOrThrow({
			where: { userId_kind: { userId: owner, kind: "physical" } },
		}),
		physicalBefore,
	);
	const ownerPhysicalCvv = (await revealCvv(owner, "physical")).cvv;
	assert.notEqual((await revealCvv(owner, "virtual")).cvv, ownerPhysicalCvv);
	const readyCards = await cardRows(owner);
	withCardKey(
		"",
		`const cards = await getCard(${JSON.stringify(owner)});
		assert.equal(cards.physical.hasCvv, true);
		assert.equal(cards.virtual.hasCvv, true);
		await assert.rejects(
			revealCvv(${JSON.stringify(owner)}, "physical"),
			error => error instanceof AppError && error.code === "BAD_REQUEST"
		);`,
	);
	assert.deepEqual(await cardRows(owner), readyCards);

	const legacy = await db.user.create({
		data: {
			username: `legacy_card_${suffix}`,
			fullName: "Legacy Card Fixture",
			pinHash: await hashPin("246802"),
			accountNumber: newAccountNumber(),
			balance: 50_000,
			cardLocked: true,
			cardDailyLimit: 123_400,
			cards: {
				create: {
					kind: "physical",
					brand: "discover",
					number: newCardNumber("discover"),
					expiresAt: cardExpiry(),
					cvvHash: await hashPin("123"),
				},
			},
		},
		select: { id: true },
	});
	users.push(legacy.id);
	const legacyBefore = await cardRows(legacy.id);
	assertNoInitializationWithKey(legacy.id, "");
	assert.deepEqual(await cardRows(legacy.id), legacyBefore);
	const legacyAccountBefore = await db.user.findUniqueOrThrow({
		where: { id: legacy.id },
	});
	assertNoInitializationWithKey(legacy.id, "", true);
	assert.deepEqual(await cardRows(legacy.id), legacyBefore);
	assert.deepEqual(
		await db.user.findUniqueOrThrow({ where: { id: legacy.id } }),
		legacyAccountBefore,
	);
	const otherBefore = await cardRows(owner);
	const upgrades = await Promise.all([
		...Array.from({ length: 6 }, () => getCard(legacy.id)),
		updateCard(legacy.id, { cardLocked: false, cardDailyLimit: 432_100 }),
	]);
	for (const result of upgrades) assertPublicCards(result);
	assert.ok(
		upgrades.every(
			(result) => result.virtual.number === upgrades[0].virtual.number,
		),
	);
	const legacyPhysicalCvv = (await revealCvv(legacy.id, "physical")).cvv;
	const legacyVirtualCvv = (await revealCvv(legacy.id, "virtual")).cvv;
	assert.notEqual(legacyPhysicalCvv, legacyVirtualCvv);
	const initialized = await cardRows(legacy.id);
	assert.equal(initialized.length, 2);
	assert.equal(initialized[0]!.number, legacyBefore[0]!.number);
	assert.equal(
		initialized[0]!.expiresAt.toISOString(),
		legacyBefore[0]!.expiresAt.toISOString(),
	);
	for (const card of initialized)
		assert.ok(
			await verifyPin(
				card.kind === "physical" ? legacyPhysicalCvv : legacyVirtualCvv,
				card.cvvHash!,
			),
		);
	const policy = await getCard(legacy.id);
	assert.equal(policy.cardLocked, false);
	assert.equal(policy.cardDailyLimit, 432_100);
	assert.equal(
		(await db.user.findUniqueOrThrow({ where: { id: legacy.id } })).balance,
		50_000,
	);
	assert.deepEqual(await cardRows(legacy.id), initialized);
	assert.deepEqual(await cardRows(owner), otherBefore);

	// A legacy virtual security code is initialized without rotating the physical code.
	await db.card.update({
		where: { userId_kind: { userId: legacy.id, kind: "virtual" } },
		data: { cvvEncrypted: null },
	});
	await getCard(legacy.id);
	assert.equal((await revealCvv(legacy.id, "physical")).cvv, legacyPhysicalCvv);
	assert.notEqual(
		(await revealCvv(legacy.id, "virtual")).cvv,
		legacyPhysicalCvv,
	);
	const existingVirtual = await db.card.findUniqueOrThrow({
		where: { userId_kind: { userId: legacy.id, kind: "virtual" } },
	});
	await db.card.update({
		where: { userId_kind: { userId: legacy.id, kind: "physical" } },
		data: { cvvEncrypted: null },
	});
	await getCard(legacy.id);
	assert.deepEqual(
		await db.card.findUniqueOrThrow({
			where: { userId_kind: { userId: legacy.id, kind: "virtual" } },
		}),
		existingVirtual,
	);
	assert.notEqual(
		(await revealCvv(legacy.id, "physical")).cvv,
		(await revealCvv(legacy.id, "virtual")).cvv,
	);

	const oldDraft = await reserve("discover");
	await db.registrationCard.update({
		where: { id: cardDraftId(oldDraft.token) },
		data: { cvvEncrypted: null },
	});
	await assert.rejects(
		register(oldDraft.token, "discover"),
		(error: unknown) =>
			error instanceof AppError &&
			error.code === "BAD_REQUEST" &&
			error.message === "Refresh your card details before confirming.",
	);
	assert.equal(
		await db.user.findUnique({
			where: { username: `card_${suffix}_${users.length}` },
		}),
		null,
	);
	assert.ok(
		await db.registrationCard.findUnique({
			where: { id: cardDraftId(oldDraft.token) },
		}),
	);
	await assert.rejects(getCard(`missing_${suffix}`));
	await assert.rejects(revealCvv(`missing_${suffix}`, "physical"));
	console.log(
		"Passed: two issued networks/PANs/CVVs, exact physical preview, shared policy, encrypted legacy preservation, automatic concurrent upgrades, missing/wrong-key rollback, account isolation and obsolete-draft rejection.",
	);
} finally {
	try {
		if (drafts.length) {
			await db.registrationCard.deleteMany({ where: { id: { in: drafts } } });
			assert.equal(
				await db.registrationCard.count({ where: { id: { in: drafts } } }),
				0,
			);
		}
		if (users.length) {
			await db.user.deleteMany({ where: { id: { in: users } } });
			assert.equal(await db.user.count({ where: { id: { in: users } } }), 0);
			assert.equal(
				await db.card.count({ where: { userId: { in: users } } }),
				0,
			);
		}
	} finally {
		await db.$disconnect();
	}
}
