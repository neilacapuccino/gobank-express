import type { Prisma } from "../../../generated/prisma";

export const activityFields = {
	id: true,
	reference: true,
	kind: true,
	title: true,
	amount: true,
	createdAt: true,
} as const;

export type ActivityEntry = Prisma.TransactionGetPayload<{
	select: typeof activityFields;
}>;
