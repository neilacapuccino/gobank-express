import { cardExpiry, newAccountNumber, newCardNumber } from "~/server/codes";
import { db } from "~/server/db";
import { fail, MESSAGES } from "~/server/errors";
import { startSession } from "~/server/session";
import type { CardBrand } from "../../../generated/prisma";
import { hashPin, verifyPin } from "./pin";

type Registration = {
  username: string;
  pin: string;
  brand: CardBrand;
  fullName: string | null;
  mobile: string | null;
  email: string | null;
};

export async function isUsernameFree(username: string) {
  const taken = await db.user.findUnique({
    where: { username },
    select: { id: true },
  });
  return !taken;
}

export async function register({ pin, brand, ...profile }: Registration) {
  const user = await db.user.create({
    data: {
      ...profile,
      pinHash: await hashPin(pin),
      accountNumber: newAccountNumber(),
      card: {
        create: {
          brand,
          number: newCardNumber(brand),
          expiresAt: cardExpiry(),
        },
      },
    },
    select: { id: true, accountNumber: true, card: true },
  });
  await startSession(user.id);
  return { accountNumber: user.accountNumber, card: user.card };
}

export async function signIn(username: string, pin: string) {
  const user = await db.user.findUnique({ where: { username } });
  if (!user || !(await verifyPin(pin, user.pinHash))) {
    fail("UNAUTHORIZED", MESSAGES.wrongCredentials);
  }
  await startSession(user.id);
}
