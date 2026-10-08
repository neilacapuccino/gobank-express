import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { db } from "../src/server/db";
import { createRegisteredAccount } from "../src/features/auth/auth.service";
import {
	cardDraftId,
	createCardPreview,
} from "../src/features/auth/card-preview.service";
import { hashPin, verifyPin } from "../src/features/auth/pin";
import { CARD_BRANDS } from "../src/features/card/card-brands";
import {
	createCvv,
	getCard,
	revealCvv,
	updateCard,
} from "../src/features/card/card.service";
import {
	cardExpiry,
	newAccountNumber,
	newCardNumber,
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
const assertPublicCard = (card: Awaited<ReturnType<typeof getCard>>) => {
	assert.equal("cvvEncrypted" in card, false);
	assert.equal("cvvHash" in card, false);
	assert.equal(typeof card.hasCvv, "boolean");
};

try {
	for (const brand of CARD_BRANDS) {
		const { token, preview } = await reserve(brand.id);
		const draft = await db.registrationCard.findUniqueOrThrow({
			where: { id: cardDraftId(token) },
		});
		assert.ok(draft.cvvEncrypted);
		const userId = await register(token, brand.id);
		const issued = await db.card.findUniqueOrThrow({ where: { userId } });
		assert.equal(issued.number, preview.number);
		assert.equal(issued.expiresAt.toISOString(), preview.expiresAt);
		assert.equal(issued.cvvEncrypted, draft.cvvEncrypted);
		assert.ok(await verifyPin(preview.cvv, issued.cvvHash!));
		assert.equal((await revealCvv(userId)).cvv, preview.cvv);
		const card = await getCard(userId);
		assertPublicCard(card);
		assert.equal(card.hasCvv, true);
		const updated = await updateCard(userId, {
			locked: true,
			dailyLimit: 100_000,
		});
		assertPublicCard(updated);
		assert.equal(updated.locked, true);
		assert.equal(updated.dailyLimit, 100_000);
		assert.equal(updated.number, issued.number);
		assert.equal((await createCvv(userId)).cvv, preview.cvv);
		assert.equal((await revealCvv(userId)).cvv, preview.cvv);
		const unchanged = await db.card.findUniqueOrThrow({ where: { userId } });
		assert.equal(unchanged.cvvEncrypted, issued.cvvEncrypted);
		assert.equal(unchanged.cvvHash, issued.cvvHash);
		assert.equal(unchanged.expiresAt.toISOString(), preview.expiresAt);
		assert.equal(
			(await db.user.findUniqueOrThrow({ where: { id: userId } })).balance,
			0,
		);
	}

	// Old registration drafts remain usable without silently replacing their CVV.
	const oldDraft = await reserve("discover");
	await db.registrationCard.update({
		where: { id: cardDraftId(oldDraft.token) },
		data: { cvvEncrypted: null },
	});
	const legacyId = await register(oldDraft.token, "discover");
	assert.equal((await getCard(legacyId)).hasCvv, false);
	await assert.rejects(revealCvv(legacyId));
	const oldCard = await db.card.findUniqueOrThrow({
		where: { userId: legacyId },
	});
	assert.equal(oldCard.cvvEncrypted, null);
	assert.ok(await verifyPin(oldDraft.preview.cvv, oldCard.cvvHash!));

	const otherId = users[0]!;
	const otherBefore = await db.card.findUniqueOrThrow({
		where: { userId: otherId },
	});
	const concurrent = await Promise.all(
		Array.from({ length: 6 }, () => createCvv(legacyId)),
	);
	const created = concurrent[0]!.cvv;
	assert.match(created, /^\d{3}$/);
	assert.ok(concurrent.every((result) => result.cvv === created));
	assert.equal((await getCard(legacyId)).hasCvv, true);
	assert.equal((await revealCvv(legacyId)).cvv, created);
	assert.equal((await createCvv(legacyId)).cvv, created);
	const legacy = await db.card.findUniqueOrThrow({
		where: { userId: legacyId },
	});
	assert.ok(legacy.cvvEncrypted);
	assert.ok(await verifyPin(created, legacy.cvvHash!));
	assert.equal(legacy.number, oldCard.number);
	assert.equal(legacy.expiresAt.toISOString(), oldCard.expiresAt.toISOString());
	assert.deepEqual(
		await db.card.findUniqueOrThrow({ where: { userId: otherId } }),
		otherBefore,
	);

	const cardless = await db.user.create({
		data: {
			username: `cardless_${suffix}`,
			fullName: "Cardless Fixture",
			pinHash: await hashPin("246802"),
			accountNumber: newAccountNumber(),
		},
		select: { id: true },
	});
	users.push(cardless.id);
	await assert.rejects(getCard(cardless.id));
	await assert.rejects(revealCvv(cardless.id));
	await assert.rejects(createCvv(cardless.id));
	await db.card.create({
		data: {
			userId: cardless.id,
			number: newCardNumber("visa"),
			expiresAt: cardExpiry(),
			brand: "visa",
		},
	});
	assert.equal((await getCard(cardless.id)).hasCvv, false);
	const setup = await createCvv(cardless.id);
	assert.equal((await revealCvv(cardless.id)).cvv, setup.cvv);
	const initialized = await db.card.findUniqueOrThrow({
		where: { userId: cardless.id },
	});
	assert.ok(await verifyPin(setup.cvv, initialized.cvvHash!));
	assert.equal((await revealCvv(legacyId)).cvv, created);
	console.log(
		"Passed: preview-to-issued CVV, safe card responses, unchanged settings/credentials, legacy draft compatibility, explicit setup, concurrent idempotence and account isolation.",
	);
} finally {
	try {
		if (drafts.length)
			await db.registrationCard.deleteMany({ where: { id: { in: drafts } } });
		if (users.length)
			await db.user.deleteMany({ where: { id: { in: users } } });
		assert.equal(await db.user.count({ where: { id: { in: users } } }), 0);
		assert.equal(
			await db.registrationCard.count({ where: { id: { in: drafts } } }),
			0,
		);
	} finally {
		await db.$disconnect();
	}
}
