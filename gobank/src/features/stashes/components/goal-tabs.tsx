"use client";

import { useState, type KeyboardEvent } from "react";
import { cn } from "~/shared/lib/cn";
import { peso, shortDate } from "~/shared/lib/format";
import type { RouterOutputs } from "~/trpc/react";

type Goal = RouterOutputs["stashes"]["get"];
type Tab = "overview" | "transactions";

const TABS: { id: Tab; label: string }[] = [
	{ id: "overview", label: "Overview" },
	{ id: "transactions", label: "Transactions" },
];

const otherTab = (tab: Tab): Tab =>
	tab === "overview" ? "transactions" : "overview";

function progressLabel(balance: number, target: number | null) {
	if (!target) return "—";
	return `${Math.min(100, Math.floor((balance / target) * 100))}%`;
}

function OverviewRow({
	label,
	value,
	highlight = false,
}: {
	label: string;
	value: string;
	highlight?: boolean;
}) {
	return (
		<div className="flex items-center justify-between gap-3 py-5 text-sm">
			<dt>{label}</dt>
			<dd className={cn("font-semibold", highlight && "text-sky")}>{value}</dd>
		</div>
	);
}

function GoalOverview({ goal }: { goal: Goal }) {
	const rate = `${(goal.annualInterestRate * 100).toFixed(2)}% p.a.`;
	const target = goal.targetAmount ? peso(goal.targetAmount) : "Not set";

	return (
		<dl className="divide-line divide-y">
			<OverviewRow label="Annual growth rate" value={rate} highlight />
			<OverviewRow label="Target" value={target} />
			<OverviewRow
				label="Progress"
				value={progressLabel(goal.balance, goal.targetAmount)}
			/>
		</dl>
	);
}

function GoalTransactions({ goal }: { goal: Goal }) {
	if (goal.transactions.length === 0) {
		return (
			<p className="text-ink-muted py-7 text-center text-sm">
				No transfers yet
			</p>
		);
	}

	return (
		<ul className="divide-line divide-y">
			{goal.transactions.map((entry) => {
				const movedIntoGoal = entry.kind === "stash" && entry.amount > 0;

				return (
					<li
						key={entry.id}
						className="flex items-center justify-between gap-4 py-4"
					>
						<div>
							<p className="text-[13px] font-medium">{entry.title}</p>
							<p className="text-ink-muted mt-1 text-[11px]">
								{shortDate(entry.createdAt)}
							</p>
						</div>
						<span
							className={cn(
								"text-[13px] font-semibold tabular-nums",
								movedIntoGoal ? "text-ink" : "text-brand",
							)}
						>
							{movedIntoGoal ? "−" : "+"}
							{peso(Math.abs(entry.amount))}
						</span>
					</li>
				);
			})}
		</ul>
	);
}

export function GoalTabs({ goal }: { goal: Goal }) {
	const [tab, setTab] = useState<Tab>("overview");

	const switchWithArrows = (event: KeyboardEvent) => {
		if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

		event.preventDefault();
		const next = otherTab(tab);
		setTab(next);
		document.getElementById(`goal-${next}`)?.focus();
	};

	return (
		<>
			<div
				role="tablist"
				aria-label="Goal details"
				className="mb-5 flex rounded-2xl border border-white/[.07] bg-[#121214] p-1"
			>
				{TABS.map(({ id, label }) => (
					<button
						key={id}
						id={`goal-${id}`}
						role="tab"
						aria-selected={tab === id}
						aria-controls="goal-panel"
						tabIndex={tab === id ? 0 : -1}
						onKeyDown={switchWithArrows}
						onClick={() => setTab(id)}
						className={cn(
							"focus-visible:outline-sky h-11 flex-1 rounded-xl text-[13px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2",
							tab === id
								? "bg-[#303034] text-white"
								: "text-ink-muted hover:text-white",
						)}
					>
						{label}
					</button>
				))}
			</div>

			<div id="goal-panel" role="tabpanel" aria-labelledby={`goal-${tab}`}>
				{tab === "overview" ? (
					<GoalOverview goal={goal} />
				) : (
					<GoalTransactions goal={goal} />
				)}
			</div>
		</>
	);
}
