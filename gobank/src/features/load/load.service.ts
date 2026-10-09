import { formatMobile } from "~/shared/lib/contact";
import { db } from "~/server/db";
import { spend } from "~/server/ledger";

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
