import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { db } from "../src/server/db";
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
	linkGoogle,
	unlinkGoogle,
} from "../src/features/auth/google/google.service";
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
	createGoal,
	getGoal,
	moveMoney,
	removeGoal,
} from "../src/features/goals/goals.service";

type Account = { id: string; username: string };

const suffix = randomUUID().replaceAll("-", "").slice(0, 10);
const PIN = "246802";
const MOBILE = "09123456789";
const ONE_YEAR = 365 * 86_400_000;

const created = {
	users: [] as string[],
	cardDrafts: [] as string[],
	billerId: undefined as string | undefined,
};

const failsWith = (message: string) => (error: unknown) =>
	error instanceof AppError && error.message === message;

const isNotFound = (error: unknown) => asDatabaseError(error)?.code === "P2025";

async function balanceOf(userId: string) {
	const user = await db.user.findUniqueOrThrow({
		where: { id: userId },
		select: { balance: true },
	});

	return user.balance;
}

async function registerAccount(
	username: string,
	fullName: string,
	brand: "visa" | "mastercard",
) {
	const preview = await createCardPreview(brand);
	created.cardDrafts.push(cardDraftId(preview.token));

	const registration = { username, fullName, mobile: null, pin: PIN, brand };
	const { id } = await createRegisteredAccount(registration, preview.token);
	created.users.push(id);

	return { account: { id, username }, preview, registration };
}

async function checkRegistrationAndPin() {
	const first = await registerAccount(
		`core_${suffix}_a`,
		"Core fixture",
		"visa",
	);
	const second = await registerAccount(
		`core_${suffix}_b`,
		"Other fixture",
		"mastercard",
	);
	const owner = first.account;

	const cards = await getCard(owner.id);
	assert.equal(cards.physical.number, first.preview.preview.number);
	assert.notEqual(cards.physical.number, cards.virtual.number);
	assert.notEqual(cards.physical.brand, cards.virtual.brand);
	assert.ok(!("cvvEncrypted" in cards.physical));

	const physicalCvv = await revealCvv(owner.id, "physical");
	const virtualCvv = await revealCvv(owner.id, "virtual");
	assert.equal(physicalCvv.cvv, first.preview.preview.cvv);
	assert.notEqual(virtualCvv.cvv, first.preview.preview.cvv);

	const stored = await db.user.findUniqueOrThrow({ where: { id: owner.id } });
	assert.ok(await verifyPin(PIN, stored.pinHash));

	await assert.rejects(async () => {
		const replay = await createRegisteredAccount(
			{ ...first.registration, username: `core_${suffix}_c` },
			first.preview.token,
		);
		created.users.push(replay.id);
	});

	await assert.rejects(
		verifyAccountPin(owner.id, "000000", MESSAGES.wrongPin),
		failsWith(MESSAGES.wrongPin),
	);
	await verifyAccountPin(owner.id, PIN, MESSAGES.wrongPin);

	return { owner, other: second.account };
}

async function checkGoogleLinking(owner: Account, other: Account) {
	const google = {
		sub: `google_${suffix}`,
		email: `core.${suffix}@gmail.com`,
		emailVerified: true,
		name: "Core fixture",
		picture: null,
	};
	const schoolAccount = { ...google, email: `core.${suffix}@school.edu` };
	const sameGmailOtherGoogle = { ...google, sub: `google_${suffix}_b` };

	assert.equal(await linkGoogle(owner.id, schoolAccount), "not-gmail");
	assert.equal(await linkGoogle(owner.id, google), "linked");
	assert.equal(await linkGoogle(owner.id, google), "already-linked");
	assert.equal(
		await linkGoogle(other.id, sameGmailOtherGoogle),
		"email-in-use",
	);

	const linkedProfile = await getProfile(owner.id);
	assert.equal(linkedProfile.googleLinked, true);
	assert.equal(linkedProfile.gmail, google.email);

	assert.deepEqual(await unlinkGoogle(owner.id), { unlinked: true });
	const unlinkedProfile = await getProfile(owner.id);
	assert.equal(unlinkedProfile.googleLinked, false);
	assert.equal(unlinkedProfile.gmail, null);
	assert.deepEqual(await unlinkGoogle(owner.id), { unlinked: false });

	assert.equal(await linkGoogle(owner.id, google), "linked");
}

async function checkProfile(owner: Account, other: Account) {
	const png = await sharp({
		create: { width: 8, height: 8, channels: 3, background: "#009b72" },
	})
		.png()
		.toBuffer();

	await updateProfile(owner.id, {
		fullName: "Saved fixture",
		mobile: null,
		profilePhoto: `data:image/png;base64,${png.toString("base64")}`,
	});

	const profile = await getProfile(owner.id);
	assert.equal(profile.fullName, "Saved fixture");
	assert.match(profile.profilePhoto ?? "", /^data:image\/webp;base64,/);

	await assert.rejects(
		updateProfile(owner.id, {
			fullName: "Must not save",
			mobile: null,
			profilePhoto: "data:image/png;base64,AAAA",
		}),
	);
	assert.deepEqual(await getProfile(owner.id), profile);

	assert.equal((await getProfile(other.id)).profilePhoto, null);
}

async function checkBillsAndLoad(owner: Account, other: Account) {
	const biller = await db.biller.create({
		data: {
			code: `core-${suffix}`,
			name: "Core biller",
			category: "internet",
			description: "Verification fixture",
		},
		select: { id: true },
	});
	created.billerId = biller.id;

	await deposit(owner.id, 100_000);
	const bill = await payBill(
		owner.id,
		biller.id,
		"00112233",
		5_000,
		"physical",
	);
	await buyLoad(owner.id, MOBILE, 10_000, "virtual");

	assert.equal(await balanceOf(owner.id), 85_000);
	assert.equal((await getOverview(owner.id)).points, 1);

	const receipt = await getTransaction(owner.id, bill.reference);
	assert.equal(receipt.id, bill.id);
	await assert.rejects(getTransaction(other.id, bill.reference), isNotFound);

	const beforeFailedLoad = await getOverview(owner.id);
	await assert.rejects(
		buyLoad(owner.id, MOBILE, 100_000, "physical"),
		failsWith(MESSAGES.insufficientBalance),
	);
	assert.deepEqual(await getOverview(owner.id), beforeFailedLoad);
}

async function checkTransfersAndRequests(owner: Account, other: Account) {
	const sent = await sendMoney(
		owner.id,
		`@${other.username}`,
		12_345,
		null,
		"physical",
	);

	const bothSides = await db.transaction.findMany({
		where: { reference: sent.reference },
	});
	const netAmount = bothSides.reduce((total, entry) => total + entry.amount, 0);
	assert.equal(bothSides.length, 2);
	assert.equal(netAmount, 0);
	assert.equal(await balanceOf(other.id), 12_345);

	const paid = await requestMoney(owner.id, other.username, 1_000, null);
	await assert.rejects(
		respondToRequest(owner.id, paid.id, true),
		failsWith(MESSAGES.requestClosed),
	);
	await respondToRequest(other.id, paid.id, true);
	await assert.rejects(
		respondToRequest(other.id, paid.id, true),
		failsWith(MESSAGES.requestClosed),
	);
	assert.equal(await balanceOf(other.id), 11_345);

	const declined = await requestMoney(owner.id, other.username, 100, null);
	await respondToRequest(other.id, declined.id, false);

	const cancelled = await requestMoney(owner.id, other.username, 100, null);
	await cancelRequest(owner.id, cancelled.id);

	const sentRequests = await listNotifications(owner.id, "sent");
	const statuses = sentRequests.items.map((request) => request.status).sort();
	assert.deepEqual(statuses, ["cancelled", "declined", "paid"]);

	const receivedRequests = await listNotifications(owner.id, "received");
	assert.equal(receivedRequests.items.length, 0);
}

async function checkCardLocks(owner: Account, other: Account) {
	await updateCard(owner.id, { lock: { kind: "physical", locked: true } });

	const beforeRefusal = await getOverview(owner.id);
	await assert.rejects(
		sendMoney(owner.id, other.username, 100, null, "physical"),
		failsWith(MESSAGES.cardLocked),
	);
	assert.deepEqual(await getOverview(owner.id), beforeRefusal);

	const paidByVirtual = await sendMoney(
		owner.id,
		other.username,
		100,
		null,
		"virtual",
	);
	const cardUsed = (paidByVirtual.details as { card: { kind: string } }).card;
	assert.equal(cardUsed.kind, "virtual");

	await updateCard(owner.id, {
		lock: { kind: "physical", locked: false },
		cardDailyLimit: 0,
	});
	await assert.rejects(
		buyLoad(owner.id, MOBILE, 1_000, "physical"),
		failsWith(MESSAGES.overDailyLimit),
	);
}

async function checkSavings(owner: Account, other: Account) {
	const goal = await createGoal(owner.id, "Core savings", 100_000);
	await moveMoney(owner.id, goal.id, 10_000, "in");
	const mainBalance = await balanceOf(owner.id);

	await db.savingsGoal.update({
		where: { id: goal.id },
		data: { interestCalculatedAt: new Date(Date.now() - ONE_YEAR) },
	});

	const afterOneYear = await getGoal(owner.id, goal.id);
	assert.ok(afterOneYear.balance > 10_400 && afterOneYear.balance < 10_420);
	assert.equal(
		(await getGoal(owner.id, goal.id)).balance,
		afterOneYear.balance,
	);
	assert.equal(await balanceOf(owner.id), mainBalance);

	await assert.rejects(getGoal(other.id, goal.id));
	await assert.rejects(removeGoal(other.id, goal.id));

	const closed = await removeGoal(owner.id, goal.id);
	assert.equal(closed.returned, afterOneYear.balance);
	assert.equal(await balanceOf(owner.id), mainBalance + closed.returned);
	assert.equal(
		await db.savingsGoal.findUnique({ where: { id: goal.id } }),
		null,
	);
}

async function cleanUp() {
	const steps = [
		() => db.user.deleteMany({ where: { id: { in: created.users } } }),
		() => db.biller.deleteMany({ where: { id: created.billerId ?? "" } }),
		() =>
			db.registrationCard.deleteMany({
				where: { id: { in: created.cardDrafts } },
			}),
	];

	for (const step of steps) {
		await step().catch((error: unknown) => console.error(error));
	}

	await db.$disconnect();
}

try {
	const { owner, other } = await checkRegistrationAndPin();

	await checkGoogleLinking(owner, other);
	await checkProfile(owner, other);
	await checkBillsAndLoad(owner, other);
	await checkTransfersAndRequests(owner, other);
	await checkCardLocks(owner, other);
	await checkSavings(owner, other);

	console.log(
		"Passed: registration, cards, PINs, Google linking, profile, payments, transfers, requests, card locks, ownership, rollback and savings.",
	);
} finally {
	await cleanUp();
}
