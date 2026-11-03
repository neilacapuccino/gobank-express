import Link from "next/link";
import { cn } from "~/shared/lib/cn";
import { dateTime, peso } from "~/shared/lib/format";
import { buttonClass } from "~/shared/ui/button";
import { PageHeader } from "~/shared/ui/page-header";
import { TransactionSummary } from "~/shared/ui/transaction-summary";
import type { RouterOutputs } from "~/trpc/react";
import { paidWithDetail } from "~/features/card/card-label";

type Transaction = RouterOutputs["activity"]["transaction"];
type Detail = { label: string; value: string };

function receiptDetails(transaction: Transaction): Detail[] {
	const { counterparty, biller, savingsGoal, points } = transaction;

	const details: Detail[] = [
		{ label: "Reference", value: transaction.reference },
		{ label: "Date", value: dateTime(transaction.createdAt) },
		{ label: "Balance after", value: peso(transaction.balanceAfter) },
	];

	if (counterparty) {
		const direction = transaction.amount < 0 ? "To" : "From";
		details.push({ label: direction, value: `@${counterparty.username}` });
	}

	if (biller) details.push({ label: "Biller", value: biller.name });
	if (savingsGoal) details.push({ label: "GoalSave", value: savingsGoal.name });
	if (points) {
		details.push({ label: "Points", value: points.toLocaleString("en-PH") });
	}

	return [...details, ...paidWithDetail(transaction.details)];
}

export function ReceiptScreen({ transaction }: { transaction: Transaction }) {
	const spent = transaction.amount < 0;

	return (
		<div className="flex flex-1 flex-col gap-7">
			<PageHeader title="Receipt" back="/transactions" />

			<TransactionSummary
				amount={transaction.amount}
				amountClassName={spent ? "text-danger" : "text-brand"}
				details={receiptDetails(transaction)}
			>
				<h2 className="text-ink text-[16px] font-medium">
					{transaction.title}
				</h2>
			</TransactionSummary>

			<Link href="/dashboard" className={cn(buttonClass(), "mt-auto")}>
				Done
			</Link>
		</div>
	);
}
