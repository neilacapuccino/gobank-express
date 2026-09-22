import { TRPCError } from "@trpc/server";
import { pointsEarned } from "~/lib/money";
import { newReference } from "~/server/codes";
import { Prisma, type TransactionKind } from "../../../generated/prisma";

export type Tx = Prisma.TransactionClient;

type Party = { id: string; username: string };

type Entry = {
  userId: string;
  kind: TransactionKind;
  title: string;
  amount: number;
  reference?: string;
  points?: number;
  counterpartyId?: string;
  stashId?: string;
  billerId?: string;
  details?: Prisma.InputJsonValue;
};

const SPENDING: TransactionKind[] = ["transfer", "bill", "load"];

const fail = (message: string): never => {
  throw new TRPCError({ code: "BAD_REQUEST", message });
};

const guard = <T>(query: Promise<T>, message: string) =>
  query.catch((error: unknown) => {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return fail(message);
    }
    throw error;
  });

const manilaMidnight = () =>
  new Date(
    `${new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" })}T00:00:00+08:00`,
  );

export async function post(
  tx: Tx,
  { userId, amount, points = 0, reference = newReference(), ...rest }: Entry,
) {
  const user = await guard(
    tx.user.update({
      where: {
        id: userId,
        balance: { gte: -amount },
        points: { gte: -points },
      },
      data: {
        balance: { increment: amount },
        points: { increment: points },
      },
    }),
    amount < 0 ? "Insufficient balance" : "Not enough points",
  );

  return tx.transaction.create({
    data: {
      ...rest,
      userId,
      amount,
      points,
      reference,
      balanceAfter: user.balance,
    },
  });
}

export async function spend(tx: Tx, entry: Omit<Entry, "points">) {
  const card = await tx.card.findUniqueOrThrow({
    where: { userId: entry.userId },
  });
  if (card.locked) fail("Unlock your card to spend");

  const today = await tx.transaction.aggregate({
    where: {
      userId: entry.userId,
      kind: { in: SPENDING },
      amount: { lt: 0 },
      createdAt: { gte: manilaMidnight() },
    },
    _sum: { amount: true },
  });
  if (entry.amount - (today._sum.amount ?? 0) > card.dailyLimit) {
    fail("This goes over your daily limit");
  }

  return post(tx, {
    ...entry,
    amount: -entry.amount,
    points: pointsEarned(entry.amount),
  });
}

export async function transfer(
  tx: Tx,
  from: Party,
  to: Party,
  amount: number,
  note?: string | null,
) {
  const reference = newReference();
  const details = note ? { note } : undefined;

  const sent = await spend(tx, {
    userId: from.id,
    kind: "transfer",
    title: `Sent to @${to.username}`,
    amount,
    reference,
    counterpartyId: to.id,
    details,
  });
  await post(tx, {
    userId: to.id,
    kind: "transfer",
    title: `Received from @${from.username}`,
    amount,
    reference,
    counterpartyId: from.id,
    details,
  });
  return sent;
}

export async function moveStash(
  tx: Tx,
  userId: string,
  stashId: string,
  amount: number,
) {
  const stash = await guard(
    tx.stash.update({
      where: { id: stashId, userId, balance: { gte: -amount } },
      data: { balance: { increment: amount } },
    }),
    "Not enough in this Stash",
  );

  return post(tx, {
    userId,
    kind: "stash",
    title: amount > 0 ? `Moved to ${stash.name}` : `Moved from ${stash.name}`,
    amount: -amount,
    stashId,
  });
}
