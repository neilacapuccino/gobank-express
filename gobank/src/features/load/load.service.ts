import { formatMobile } from "~/shared/lib/contact";
import { db } from "~/server/db";
import { spend } from "~/server/ledger";
import type { CardKind } from "../../../generated/prisma";

export const buyLoad = (
	userId: string,
	mobile: string,
	amount: number,
	card: CardKind,
) =>
	db.$transaction((tx) =>
		spend(tx, {
			userId,
			kind: "load",
			title: `Mobile load · ${formatMobile(mobile)}`,
			amount,
			details: { mobile },
			card,
		}),
	);
