import { cardExpiry, newAccountNumber, newCardNumber } from "~/server/codes";
import { db } from "~/server/db";
import { fail, MESSAGES } from "~/server/errors";
import { endOtherSessions, startSession } from "~/server/session";
import type { CardBrand } from "../../../generated/prisma";
import {
  lockExpiry,
  lockMinutesLeft,
  MAX_PIN_ATTEMPTS,
  PIN_LOCK_MINUTES,
} from "./auth.rules";
import { hashPin, verifyPin } from "./pin";

type PinOwner = { id: string; pinHash: string; lockedUntil: Date | null };

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

async function checkPin(user: PinOwner, pin: string, wrongMessage: string) {
  const now = new Date();
  const minutesLeft = lockMinutesLeft(user.lockedUntil, now);
  if (minutesLeft > 0) {
    fail("TOO_MANY_REQUESTS", MESSAGES.pinLocked(minutesLeft));
  }

  const correct = await verifyPin(pin, user.pinHash);
  const { failedPinAttempts } = await db.user.update({
    where: { id: user.id },
    data: correct
      ? { failedPinAttempts: 0, lockedUntil: null }
      : { failedPinAttempts: { increment: 1 } },
    select: { failedPinAttempts: true },
  });
  if (correct) return;
  if (failedPinAttempts < MAX_PIN_ATTEMPTS) fail("UNAUTHORIZED", wrongMessage);

  await db.user.update({
    where: { id: user.id },
    data: { failedPinAttempts: 0, lockedUntil: lockExpiry(now) },
  });
  fail("TOO_MANY_REQUESTS", MESSAGES.pinLocked(PIN_LOCK_MINUTES));
}

export async function signIn(username: string, pin: string) {
  const user = await db.user.findUnique({ where: { username } });
  if (!user) return fail("UNAUTHORIZED", MESSAGES.wrongCredentials);
  await checkPin(user, pin, MESSAGES.wrongCredentials);
  await startSession(user.id);
}

export async function changePin(
  userId: string,
  currentPin: string,
  newPin: string,
) {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  await checkPin(user, currentPin, MESSAGES.wrongPin);
  await db.user.update({
    where: { id: userId },
    data: { pinHash: await hashPin(newPin) },
  });
  await endOtherSessions(userId);
}
