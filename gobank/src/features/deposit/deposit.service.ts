import { db } from "~/server/db";
import { post } from "~/server/ledger";

export const deposit = (userId: string, amount: number) =>
	db.$transaction((tx) =>
		post(tx, { userId, kind: "deposit", title: "Cash in", amount }),
	);
