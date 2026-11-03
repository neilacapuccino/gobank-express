"use client";

import { useIsMutating } from "@tanstack/react-query";
import { ArrowDownLeft, ArrowUpRight, Settings2 } from "lucide-react";
import { useState } from "react";
import { cn } from "~/shared/lib/cn";
import { peso } from "~/shared/lib/format";
import { PageHeader } from "~/shared/ui/page-header";
import { errorMessage } from "~/trpc/error-message";
import { api, type RouterOutputs } from "~/trpc/react";
import { useGoalIcon } from "../hooks/use-goal-icon";
import { GoalBubble } from "./goal-bubble";
import { GoalSettingsForm } from "./goal-settings-form";
import { GoalTabs } from "./goal-tabs";
import { GoalTransferForm } from "./goal-transfer-form";

type Goal = RouterOutputs["goals"]["get"];
type Action = "in" | "out" | "settings";

const ACTIONS = [
	{ id: "in", label: "Transfer in", icon: ArrowDownLeft },
	{ id: "out", label: "Transfer out", icon: ArrowUpRight },
	{ id: "settings", label: "Settings", icon: Settings2 },
] as const;

const REFRESH_EVERY_MS = 15_000;
const SAVINGS_CHANGES = { mutationKey: [["goals"]] };

function ActionButtons({
	disabled,
	onSelect,
}: {
	disabled: boolean;
	onSelect: (action: Action) => void;
}) {
	return (
		<div className="grid grid-cols-3 gap-2 px-4 py-5">
			{ACTIONS.map(({ id, label, icon: Icon }) => (
				<button
					key={id}
					type="button"
					disabled={disabled}
					onClick={() => onSelect(id)}
					className="group focus-visible:outline-sky flex min-h-20 flex-col items-center gap-2 rounded-2xl py-2 focus-visible:outline-2 focus-visible:outline-offset-4 disabled:opacity-45"
				>
					<span
						className={cn(
							"bg-tile group-hover:bg-tile-hover grid h-14 w-14 place-items-center rounded-full border border-white/[.08] transition-colors",
							id === "in" ? "text-sky" : "text-ink-bright",
						)}
					>
						<Icon size={25} aria-hidden />
					</span>
					<span className="text-[11px] font-semibold">{label}</span>
				</button>
			))}
		</div>
	);
}

function GoalContent({ goal }: { goal: Goal }) {
	const { icon, setIcon } = useGoalIcon(goal.id, goal.name);
	const [action, setAction] = useState<Action | null>(null);
	const [message, setMessage] = useState("");
	const saving = useIsMutating(SAVINGS_CHANGES) > 0;

	const open = (next: Action) => {
		setMessage("");
		setAction(next);
	};

	const finish = (doneMessage: string) => {
		setAction(null);
		setMessage(doneMessage);
	};

	const close = () => setAction(null);

	return (
		<div className="bg-surface-sunken text-ink -mx-6 -mt-8 -mb-10 flex flex-1 flex-col pt-7">
			<div className="px-5">
				<PageHeader title={goal.name} back="/goals" />
			</div>

			<section className="px-8 pt-7 pb-4 text-center">
				<GoalBubble
					icon={icon}
					balance={goal.balance}
					target={goal.targetAmount}
					label={goal.name}
					large
				/>
				<h1 className="mt-4 text-[36px] font-bold tracking-tight break-all tabular-nums">
					{peso(goal.balance)}
				</h1>
			</section>

			<ActionButtons disabled={saving} onSelect={open} />

			<div className="bg-surface flex-1 rounded-t-[30px] px-5 pt-5 pb-10 shadow-[0_-8px_24px_-20px_#00000080]">
				{message ? (
					<p
						role="status"
						className="bg-brand-soft text-ink-soft mb-4 rounded-2xl p-3 text-sm"
					>
						{message}
					</p>
				) : null}

				{action === "in" || action === "out" ? (
					<GoalTransferForm
						key={action}
						goalId={goal.id}
						goalBalance={goal.balance}
						direction={action}
						onDone={finish}
						onCancel={close}
					/>
				) : null}

				{action === "settings" ? (
					<GoalSettingsForm
						goal={goal}
						icon={icon}
						onIconChange={setIcon}
						onDone={finish}
						onCancel={close}
					/>
				) : null}

				<GoalTabs goal={goal} />
			</div>
		</div>
	);
}

export function GoalDetail({ id }: { id: string }) {
	const query = api.goals.get.useQuery(
		{ id },
		{ refetchInterval: REFRESH_EVERY_MS },
	);

	if (query.isPending) return <p role="status">Loading your GoalSave…</p>;

	if (query.isError) {
		return (
			<div>
				<PageHeader title="GoalSave" back="/goals" />
				<p role="alert" className="text-danger mt-8">
					{errorMessage(query.error)}
				</p>
				<button
					type="button"
					onClick={() => void query.refetch()}
					className="bg-tile text-ink-bright mt-5 rounded-xl border border-white/10 px-5 py-3 focus-visible:outline-2 focus-visible:outline-offset-4"
				>
					Try again
				</button>
			</div>
		);
	}

	return <GoalContent goal={query.data} />;
}
