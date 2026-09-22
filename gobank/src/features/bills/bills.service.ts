import { db } from "~/server/db";
import { spend } from "~/server/ledger";

export const listBillers = () =>
  db.biller.findMany({
    where: { active: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

export async function payBill(
  userId: string,
  billerId: string,
  accountNumber: string,
  amount: number,
) {
  const biller = await db.biller.findUniqueOrThrow({
    where: { id: billerId, active: true },
  });
  return db.$transaction((tx) =>
    spend(tx, {
      userId,
      kind: "bill",
      title: `${biller.name} bill`,
      amount,
      billerId: biller.id,
      details: { accountNumber },
    }),
  );
}
