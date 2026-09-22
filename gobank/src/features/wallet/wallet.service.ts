import { formatMobile } from "~/lib/registration";
import { db } from "~/server/db";
import { post, spend } from "~/server/ledger";

export const deposit = (userId: string, amount: number) =>
  db.$transaction((tx) =>
    post(tx, { userId, kind: "deposit", title: "Cash in", amount }),
  );

export const buyLoad = (userId: string, mobile: string, amount: number) =>
  db.$transaction((tx) =>
    spend(tx, {
      userId,
      kind: "load",
      title: `Load for ${formatMobile(mobile)}`,
      amount,
      details: { mobile },
    }),
  );
