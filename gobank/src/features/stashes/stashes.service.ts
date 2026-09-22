import { MAX_STASHES } from "~/lib/money";
import { db } from "~/server/db";
import { fail, MESSAGES } from "~/server/errors";
import { moveStash } from "~/server/ledger";

type StashFields = { name?: string; goal?: number | null };

export const listStashes = (userId: string) =>
  db.stash.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });

export const getStash = (userId: string, id: string) =>
  db.stash.findUniqueOrThrow({
    where: { id, userId },
    include: { transactions: { orderBy: { createdAt: "desc" }, take: 20 } },
  });

export async function createStash(
  userId: string,
  name: string,
  goal?: number | null,
) {
  const count = await db.stash.count({ where: { userId } });
  if (count >= MAX_STASHES) fail("BAD_REQUEST", MESSAGES.stashLimit);
  return db.stash.create({ data: { userId, name, goal } });
}

export const updateStash = (userId: string, id: string, fields: StashFields) =>
  db.stash.update({ where: { id, userId }, data: fields });

export const moveMoney = (
  userId: string,
  id: string,
  amount: number,
  direction: "in" | "out",
) =>
  db.$transaction((tx) =>
    moveStash(tx, userId, id, direction === "in" ? amount : -amount),
  );

export const removeStash = (userId: string, id: string) =>
  db.$transaction(async (tx) => {
    const stash = await tx.stash.findUniqueOrThrow({ where: { id, userId } });
    if (stash.balance > 0) {
      await moveStash(tx, userId, stash.id, -stash.balance);
    }
    await tx.stash.delete({ where: { id: stash.id } });
  });
