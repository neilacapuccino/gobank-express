import { PrismaClient, type BillerCategory } from "../generated/prisma";
import { hashPin } from "../src/features/auth/pin";
import { newCardCredentials } from "../src/features/card/card-credentials.server";
import { virtualCardBrand } from "../src/features/card/card-generation.server";
import { newAccountNumber, newReference } from "../src/server/identifiers";

const db = new PrismaClient();

const DEMO_PIN = "135790";
const OPENING_BALANCE_CENTAVOS = 500_000;

const BILLERS: [string, string, BillerCategory, string][] = [
	["meralco", "Meralco", "electric", "Power Utility Partner"],
	["aboitiz-power", "AboitizPower", "electric", "Power Utility Partner"],
	["manila-water", "Manila Water", "water", "Water Utility Partner"],
	["maynilad", "Maynilad", "water", "Water Utility Partner"],
	["pldt", "PLDT", "internet", "Internet Service Provider"],
	["converge", "Converge", "internet", "Internet Service Provider"],
	["bdo-credit-card", "BDO Credit Card", "credit_card", "Credit Card Payment"],
	["bpi-credit-card", "BPI Credit Card", "credit_card", "Credit Card Payment"],
];

const DEMO_USERS = [
	{ username: "maricel", fullName: "Maricel Santos", mobile: "09171234567" },
	{ username: "dante", fullName: "Dante Reyes", mobile: "09181234567" },
];

type DemoUser = (typeof DEMO_USERS)[number];

async function seedBillers() {
	for (const [code, name, category, description] of BILLERS) {
		await db.biller.upsert({
			where: { code },
			update: { name, category, description },
			create: { code, name, category, description },
		});
	}
}

async function seedDemoUser(person: DemoUser, pinHash: string) {
	const exists = await db.user.findUnique({
		where: { username: person.username },
	});
	if (exists) return;

	const physical = newCardCredentials("discover");
	const virtual = newCardCredentials(
		virtualCardBrand(physical.card.brand),
		physical.cvv,
	);

	await db.user.create({
		data: {
			...person,
			pinHash,
			accountNumber: newAccountNumber(),
			balance: OPENING_BALANCE_CENTAVOS,
			cards: {
				create: [
					{ ...physical.card, kind: "physical" },
					{ ...virtual.card, kind: "virtual" },
				],
			},
			transactions: {
				create: {
					reference: newReference(),
					kind: "deposit",
					title: "Opening deposit",
					amount: OPENING_BALANCE_CENTAVOS,
					balanceAfter: OPENING_BALANCE_CENTAVOS,
				},
			},
		},
	});
}

async function main() {
	await seedBillers();

	const pinHash = await hashPin(DEMO_PIN);
	for (const person of DEMO_USERS) {
		await seedDemoUser(person, pinHash);
	}
}

main()
	.then(() => console.log("Seeded billers and demo users"))
	.catch((error: unknown) => {
		console.error(error);
		process.exit(1);
	})
	.finally(() => void db.$disconnect());
