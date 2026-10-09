import Link from "next/link";
import { dateTime, peso } from "~/shared/lib/format";
import { buttonClass } from "~/shared/ui/button";
import { PageHeader } from "~/shared/ui/page-header";
import { TransactionSummary } from "~/shared/ui/transaction-summary";
import type { RouterOutputs } from "~/trpc/react";

export function ReceiptScreen({
	transaction,
}: {
	transaction: RouterOutputs["activity"]["transaction"];
}) {
	const details = [
		{ label: "Reference", value: transaction.reference },
		{ label: "Date", value: dateTime(transaction.createdAt) },
		{ label: "Balance after", value: peso(transaction.balanceAfter) },
	];
	if (transaction.counterparty)
		details.push({
			label: transaction.amount < 0 ? "To" : "From",
			value: `@${transaction.counterparty.username}`,
		});
	if (transaction.biller)
		details.push({ label: "Biller", value: transaction.biller.name });
	if (transaction.stash)
		details.push({ label: "GoalSave", value: transaction.stash.name });
	if (transaction.points)
		details.push({
			label: "Points",
			value: transaction.points.toLocaleString(),
		});
	return (
		<div className="flex flex-1 flex-col gap-7">
			<PageHeader title="Receipt" back="/transactions" />
			<TransactionSummary
				amount={transaction.amount}
				amountClassName={transaction.amount < 0 ? "text-danger" : "text-brand"}
				details={details}
			>
				<h2 className="text-ink text-[16px] font-medium">
					{transaction.title}
				</h2>
			</TransactionSummary>
			<Link href="/dashboard" className={`${buttonClass()} mt-auto`}>
				Done
			</Link>
		</div>
	);
}
