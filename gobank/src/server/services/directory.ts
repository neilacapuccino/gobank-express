import { TRPCError } from "@trpc/server";
import { normaliseMobile } from "~/lib/registration";
import type { Tx } from "./ledger";

export const PARTY = { id: true, username: true, fullName: true } as const;

export async function findUser(tx: Tx, handle: string, self: string) {
  const value = handle.trim().replace(/^@/, "").toLowerCase();
  const mobile = normaliseMobile(value);

  const user = await tx.user.findFirst({
    where: {
      OR: [
        { accountNumber: value },
        { username: value },
        ...(mobile ? [{ mobile }] : []),
      ],
    },
    select: PARTY,
  });

  if (!user) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "No GoBank account matches that",
    });
  }
  if (user.id === self) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "That is your own account",
    });
  }
  return user;
}
