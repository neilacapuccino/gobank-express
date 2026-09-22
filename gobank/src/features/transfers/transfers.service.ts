import { normaliseMobile } from "~/lib/registration";
import { db } from "~/server/db";
import { fail, MESSAGES } from "~/server/errors";
import { transfer } from "~/server/ledger";

export const PARTY = { id: true, username: true, fullName: true } as const;

export async function findRecipient(handle: string, self: string) {
  const value = handle.trim().replace(/^@/, "").toLowerCase();
  const mobile = normaliseMobile(value);

  const user = await db.user.findFirst({
    where: {
      OR: [
        { accountNumber: value },
        { username: value },
        ...(mobile ? [{ mobile }] : []),
      ],
    },
    select: PARTY,
  });

  if (!user) return fail("NOT_FOUND", MESSAGES.recipientNotFound);
  if (user.id === self) fail("BAD_REQUEST", MESSAGES.ownAccount);
  return user;
}

export async function sendMoney(
  userId: string,
  to: string,
  amount: number,
  note: string | null,
) {
  const receiver = await findRecipient(to, userId);
  const sender = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: PARTY,
  });
  return db.$transaction((tx) => transfer(tx, sender, receiver, amount, note));
}
