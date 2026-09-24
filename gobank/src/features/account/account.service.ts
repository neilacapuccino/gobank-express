import { db } from "~/server/db";

export const getOverview = (userId: string) =>
  db.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      username: true,
      fullName: true,
      accountNumber: true,
      balance: true,
      points: true,
      _count: { select: { stashes: true } },
      transactions: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

export const getProfile = (userId: string) =>
  db.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      username: true,
      fullName: true,
      mobile: true,
      email: true,
      accountNumber: true,
      createdAt: true,
    },
  });

export async function listActivity(
  userId: string,
  cursor: string | null | undefined,
  limit: number,
) {
  const items = await db.transaction.findMany({
    where: { userId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  const next = items.length > limit ? items.pop()?.id : null;
  return { items, next };
}

export const getTransaction = (userId: string, reference: string) =>
  db.transaction.findUniqueOrThrow({
    where: { reference_userId: { reference, userId } },
    include: {
      biller: true,
      stash: { select: { name: true } },
      counterparty: { select: { username: true, fullName: true } },
    },
  });

type ProfileUpdate = {
  fullName: string | null;
  mobile: string | null;
  email: string | null;
};

export const updateProfile = (userId: string, profile: ProfileUpdate) =>
  db.user.update({
    where: { id: userId },
    data: profile,
    select: { id: true },
  });
