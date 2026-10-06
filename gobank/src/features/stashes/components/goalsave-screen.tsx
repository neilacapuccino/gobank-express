"use client";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { MAX_STASHES } from "~/shared/lib/money";
import { peso } from "~/shared/lib/format";
import { PageHeader } from "~/shared/ui/page-header";
import { GoMenu } from "~/features/account/components/go-menu";
import { errorMessage } from "~/trpc/error-message";
import { api, type RouterOutputs } from "~/trpc/react";
import { CreateGoalForm } from "./create-goal-form";
import { GoalBubble } from "./goal-bubble";
import { useGoalIcon } from "./goal-icon-preference";

export function GoalSaveScreen() {
	const router = useRouter();
	const utils = api.useUtils();
	const goals = api.stashes.list.useQuery(undefined, {
		refetchInterval: 15_000,
	});
	const [creating, setCreating] = useState(false);
	const [notice, setNotice] = useState("");
	const count = goals.data?.length ?? 0;
	const total = goals.data?.reduce((sum, goal) => sum + goal.balance, 0) ?? 0;
	if (creating)
		return (
			<CreateGoalForm
				onCancel={() => setCreating(false)}
				onCreated={(goal) => {
					utils.stashes.list.setData(undefined, (current) => [
						...(current ?? []).filter((item) => item.id !== goal.id),
						goal,
					]);
					void utils.stashes.list.invalidate();
					void utils.account.overview.invalidate();
					setCreating(false);
					setNotice(`“${goal.name}” created.`);
					router.refresh();
				}}
			/>
		);
	return (
		<div className="bg-surface-sunken text-ink -mx-6 -mt-8 -mb-10 flex flex-1 flex-col gap-6 px-5 pt-7 pb-28">
			<PageHeader title="GoalSave" back="/dashboard" />
			<section
				aria-label="Savings overview"
				className="rounded-[28px] border border-white/[.08] bg-[#1b1b1d] p-6"
			>
				<p className="text-ink-muted text-[12px] font-medium">Total saved</p>
				<p className="mt-4 text-[clamp(1.8rem,8vw,2.5rem)] font-semibold tracking-tight break-all tabular-nums">
					{goals.data ? peso(total) : "—"}
				</p>
				<div className="mt-6 flex items-center justify-between gap-4 border-t border-white/[.07] pt-4">
					<p className="text-ink-muted text-[11px]">
						{goals.data ? count : "—"} / {MAX_STASHES} goals
					</p>
					<div className="flex gap-1.5" aria-hidden>
						{Array.from({ length: MAX_STASHES }, (_, index) => (
							<span
								key={index}
								className={`h-1.5 w-6 rounded-full ${index < count ? "bg-[#71d5f3]" : "bg-white/10"}`}
							/>
						))}
					</div>
				</div>
			</section>
			{notice && (
				<p
					role="status"
					className="bg-surface-raised text-ink-soft rounded-2xl p-3 text-[12px]"
				>
					{notice}
				</p>
			)}
			{goals.isPending && (
				<p role="status" className="text-center text-sm">
					Loading your goals…
				</p>
			)}
			{goals.isError && (
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
			)}
			{goals.data && (
				<>
					<div className="grid grid-cols-2 items-start gap-x-5 gap-y-8 py-3">
						<button
							type="button"
							disabled={count >= MAX_STASHES}
							aria-describedby={count >= MAX_STASHES ? "goal-limit" : undefined}
							onClick={() => {
								setNotice("");
								setCreating(true);
							}}
							className={`group flex min-h-52 flex-col items-center justify-center gap-4 rounded-[28px] px-1 py-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#71d5f3] disabled:cursor-not-allowed disabled:opacity-45 ${count === 0 ? "col-span-2" : ""}`}
						>
							<span className="grid h-20 w-20 place-items-center rounded-full border border-white/10 bg-[#242426] text-[#71d5f3] transition-transform group-hover:scale-105">
								<Plus size={28} strokeWidth={1.7} aria-hidden />
							</span>
							<span className="text-[13px] font-semibold">New goal</span>
						</button>
						{goals.data.map((goal) => (
							<GoalTile key={goal.id} goal={goal} />
						))}
					</div>
					{count >= MAX_STASHES && (
						<p
							id="goal-limit"
							className="text-ink-muted text-center text-[11px]"
						>
							Goal limit reached
						</p>
					)}
				</>
			)}
			<GoMenu />
		</div>
	);
}
function GoalTile({
	goal,
}: {
	goal: RouterOutputs["stashes"]["list"][number];
}) {
	const { icon } = useGoalIcon(goal.id, goal.name);
	return (
		<Link
			href={`/stashes/${goal.id}`}
			className="group min-w-0 rounded-[28px] text-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#71d5f3]"
		>
			<div className="transition-transform duration-200 group-hover:-translate-y-1">
				<GoalBubble
					icon={icon}
					balance={goal.balance}
					target={goal.goal}
					label={goal.name}
				/>
			</div>
			<h2 className="text-ink-soft mt-4 text-[12px] font-medium break-words">
				{goal.name}
			</h2>
			<p className="mt-1.5 text-[20px] font-semibold tracking-tight break-all tabular-nums">
				{peso(goal.balance)}
			</p>
			<p className="mt-2 text-[10px] text-[#71d5f3]">
				{(goal.interestRate * 100).toFixed(2)}% per year
			</p>
			{goal.goal !== null && (
				<p className="text-ink-faint mt-2 text-[10px] break-words">
					Target {peso(goal.goal)}
				</p>
			)}
		</Link>
	);
}
