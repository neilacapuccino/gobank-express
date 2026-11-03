import { db } from "~/server/db";
import { fail } from "~/server/errors";
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
	const biller = await db.biller.findFirst({
		where: { id: billerId, active: true },
	});
	if (!biller) return fail("NOT_FOUND", "This biller is not available.");
	return db.$transaction((tx) =>
		spend(tx, {
			userId,
			kind: "bill",
			title: `Bill payment · ${biller.name}`,
			amount,
			billerId: biller.id,
			details: { accountNumber },
		}),
	);
}
