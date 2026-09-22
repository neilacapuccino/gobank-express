import { PrismaClient, type BillerCategory } from "../generated/prisma";
import { hashPin } from "../src/server/auth/pin";
import {
  cardExpiry,
  newAccountNumber,
  newCardNumber,
  newReference,
} from "../src/server/codes";

const db = new PrismaClient();

const DEMO_PIN = "135790";

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

const OPENING_BALANCE = 500000;

async function main() {
  for (const [code, name, category, description] of BILLERS) {
    await db.biller.upsert({
      where: { code },
      update: { name, category, description },
      create: { code, name, category, description },
    });
  }

  const pinHash = await hashPin(DEMO_PIN);

  for (const person of DEMO_USERS) {
    const exists = await db.user.findUnique({
      where: { username: person.username },
    });
    if (exists) continue;

    await db.user.create({
      data: {
        ...person,
        pinHash,
        accountNumber: newAccountNumber(),
        balance: OPENING_BALANCE,
        card: {
          create: { number: newCardNumber("gobank"), expiresAt: cardExpiry() },
        },
        transactions: {
          create: {
            reference: newReference(),
            kind: "deposit",
            title: "Opening deposit",
            amount: OPENING_BALANCE,
            balanceAfter: OPENING_BALANCE,
          },
        },
      },
    });
  }
}

main()
  .then(() => console.log("Seeded billers and demo users"))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => void db.$disconnect());
