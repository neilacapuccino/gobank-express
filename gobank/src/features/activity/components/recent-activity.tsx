import Link from "next/link";
import { shortDate } from "~/shared/lib/format";
import { SectionHeader } from "~/shared/ui/section-header";
import type { ActivityEntry } from "../activity.fields";
import { ActivityRow } from "./activity-row";

function NoTransactions() {
	return (
		<div className="bg-surface-sunken flex flex-col items-center gap-1 rounded-2xl px-6 py-8 text-center">
			<p className="text-ink text-[14px] font-medium">No transactions yet</p>
			<Link
				href="/deposit"
				className="text-brand hover:text-brand-hover mt-2 text-[13px] font-medium transition-colors"
			>
				Make a deposit
			</Link>
		</div>
	);
}

export function RecentActivity({ entries }: { entries: ActivityEntry[] }) {
	return (
		<section>
			<SectionHeader title="Recent transactions" href="/transactions" />

			{entries.length === 0 ? (
				<NoTransactions />
			) : (
				<ul className="flex flex-col gap-4">
					{entries.map((entry) => (
						<li key={entry.reference}>
							<ActivityRow entry={entry} detail={shortDate(entry.createdAt)} />
						</li>
					))}
				</ul>
			)}
		</section>
	);
}
