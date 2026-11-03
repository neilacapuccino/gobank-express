"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "~/shared/lib/cn";
import { peso } from "~/shared/lib/format";
import { MAX_STASHES } from "~/shared/lib/money";
import { GoMenu } from "~/shared/ui/go-menu";
import { PageHeader } from "~/shared/ui/page-header";
import { errorMessage } from "~/trpc/error-message";
import { api, type RouterOutputs } from "~/trpc/react";
import { useGoalIcon } from "../hooks/use-goal-icon";
import { CreateGoalForm } from "./create-goal-form";
import { GoalBubble } from "./goal-bubble";

type Goal = RouterOutputs["stashes"]["list"][number];

const REFRESH_EVERY_MS = 15_000;

function SavingsOverview({ goals }: { goals: Goal[] | undefined }) {
	const count = goals?.length ?? 0;
	const total = goals?.reduce((sum, goal) => sum + goal.balance, 0) ?? 0;

	return (
		<section
			aria-label="Savings overview"
			className="bg-surface rounded-[28px] border border-white/[.08] p-6"
		>
			<p className="text-ink-muted text-[12px] font-medium">Total saved</p>
			<p className="mt-4 text-[clamp(1.8rem,8vw,2.5rem)] font-semibold tracking-tight break-all tabular-nums">
				{goals ? peso(total) : "—"}
			</p>

			<div className="mt-6 flex items-center justify-between gap-4 border-t border-white/[.07] pt-4">
				<p className="text-ink-muted text-[11px]">
					{goals ? count : "—"} / {MAX_STASHES} goals
				</p>
				<div className="flex gap-1.5" aria-hidden>
					{Array.from({ length: MAX_STASHES }, (_, index) => (
						<span
							key={index}
							className={cn(
								"h-1.5 w-6 rounded-full",
								index < count ? "bg-sky" : "bg-white/10",
							)}
						/>
					))}
				</div>
			</div>
		</section>
	);
}

function NewGoalButton({
	full,
	wide,
	onClick,
}: {
	full: boolean;
	wide: boolean;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			disabled={full}
			aria-describedby={full ? "goal-limit" : undefined}
			onClick={onClick}
			className={cn(
				"group focus-visible:outline-sky flex min-h-52 flex-col items-center justify-center gap-4 rounded-[28px] px-1 py-4 focus-visible:outline-2 focus-visible:outline-offset-4 disabled:cursor-not-allowed disabled:opacity-45",
				wide && "col-span-2",
			)}
		>
			<span className="text-sky grid h-20 w-20 place-items-center rounded-full border border-white/10 bg-[#242426] transition-transform group-hover:scale-105">
				<Plus size={28} strokeWidth={1.7} aria-hidden />
			</span>
			<span className="text-[13px] font-semibold">New goal</span>
		</button>
	);
}

function GoalTile({ goal }: { goal: Goal }) {
	const { icon } = useGoalIcon(goal.id, goal.name);

	return (
		<Link
			href={`/stashes/${goal.id}`}
			className="group focus-visible:outline-sky min-w-0 rounded-[28px] text-center focus-visible:outline-2 focus-visible:outline-offset-4"
		>
			<div className="transition-transform duration-200 group-hover:-translate-y-1">
				<GoalBubble
					icon={icon}
					balance={goal.balance}
					target={goal.targetAmount}
					label={goal.name}
				/>
			</div>

			<h2 className="text-ink-soft mt-4 text-[12px] font-medium break-words">
				{goal.name}
			</h2>
			<p className="mt-1.5 text-[20px] font-semibold tracking-tight break-all tabular-nums">
				{peso(goal.balance)}
			</p>
			<p className="text-sky mt-2 text-[10px]">
				{(goal.annualInterestRate * 100).toFixed(2)}% p.a.
			</p>

			{goal.targetAmount !== null ? (
				<p className="text-ink-faint mt-2 text-[10px] break-words">
					Target {peso(goal.targetAmount)}
				</p>
			) : null}
		</Link>
	);
}

export function GoalSaveScreen() {
	const router = useRouter();
	const utils = api.useUtils();
	const goals = api.stashes.list.useQuery(undefined, {
		refetchInterval: REFRESH_EVERY_MS,
	});
	const [creating, setCreating] = useState(false);
	const [notice, setNotice] = useState("");

	const count = goals.data?.length ?? 0;
	const full = count >= MAX_STASHES;

	const startCreating = () => {
		setNotice("");
		setCreating(true);
	};

	const showCreatedGoal = (goal: Goal) => {
		utils.stashes.list.setData(undefined, (current) => [
			...(current ?? []).filter((item) => item.id !== goal.id),
			goal,
		]);
		setCreating(false);
		setNotice(`“${goal.name}” created.`);
		router.refresh();
	};

	if (creating) {
		return (
			<CreateGoalForm
				onCancel={() => setCreating(false)}
				onCreated={showCreatedGoal}
			/>
		);
	}

	return (
		<div className="bg-surface-sunken text-ink -mx-6 -mt-8 -mb-10 flex flex-1 flex-col gap-6 px-5 pt-7 pb-28">
			<PageHeader title="GoalSave" back="/dashboard" />

			<SavingsOverview goals={goals.data} />

			{notice ? (
				<p
					role="status"
					className="bg-surface-raised text-ink-soft rounded-2xl p-3 text-[12px]"
				>
					{notice}
				</p>
			) : null}

			{goals.isPending ? (
				<p role="status" className="text-center text-sm">
					Loading your goals…
				</p>
			) : null}

			{goals.isError ? (
				<div role="alert">
					<p className="text-danger mb-3 text-sm">
						{errorMessage(goals.error)}
					</p>
					<button
						type="button"
						disabled={goals.isFetching}
						onClick={() => void goals.refetch()}
						className="min-h-10 rounded-xl border border-white/10 bg-white/5 px-4 text-[12px] font-medium focus-visible:outline-2 focus-visible:outline-offset-4 disabled:opacity-50"
					>
						Try again
					</button>
				</div>
			) : null}

			{goals.data ? (
				<>
					<div className="grid grid-cols-2 items-start gap-x-5 gap-y-8 py-3">
						<NewGoalButton
							full={full}
							wide={count === 0}
							onClick={startCreating}
						/>
						{goals.data.map((goal) => (
							<GoalTile key={goal.id} goal={goal} />
						))}
					</div>

					{full ? (
						<p
							id="goal-limit"
							className="text-ink-muted text-center text-[11px]"
						>
							Goal limit reached
						</p>
					) : null}
				</>
			) : null}

			<GoMenu />
		</div>
	);
}
