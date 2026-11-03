"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { isPesoInput } from "~/shared/lib/amount-input";
import { peso } from "~/shared/lib/format";
import { toCentavos, toPesos } from "~/shared/lib/money";
import { Button } from "~/shared/ui/button";
import { FormError } from "~/shared/ui/money-form-ui";
import { TextField } from "~/shared/ui/text-field";
import { errorMessage } from "~/trpc/error-message";
import { api } from "~/trpc/react";
import {
	goalAmountError,
	isValidGoalName,
	GOAL_NAME_MAX,
} from "../goals.rules";
import type { GoalIcon } from "./goal-art";
import { GoalIconPicker } from "./goal-icon-picker";

type Goal = {
	id: string;
	name: string;
	balance: number;
	targetAmount: number | null;
};

function CloseGoal({
	goalId,
	balance,
	disabled,
}: {
	goalId: string;
	balance: number;
	disabled: boolean;
}) {
	const router = useRouter();
	const [confirming, setConfirming] = useState(false);

	const remove = api.goals.remove.useMutation({
		onSuccess: () => {
			router.replace("/goals");
			router.refresh();
		},
	});

	const busy = disabled || remove.isPending || remove.isSuccess;

	if (!confirming) {
		return (
			<button
				type="button"
				disabled={busy}
				onClick={() => setConfirming(true)}
				className="text-danger h-11 w-full text-sm font-medium disabled:opacity-45"
			>
				Close goal
			</button>
		);
	}

	return (
		<div
			className="border-line space-y-3 rounded-xl border p-4"
			role="region"
			aria-label="Close goal confirmation"
		>
			<h3 className="font-semibold">Close this goal?</h3>
			<p className="text-ink-soft text-[13px] leading-relaxed">
				{peso(balance)} will return to your main account. This goal will be
				removed, and past transfers will stay in your account activity.
			</p>

			<FormError error={errorMessage(remove.error)} />

			<button
				type="button"
				disabled={busy}
				onClick={() => remove.mutate({ id: goalId })}
				className="bg-danger-soft text-danger h-11 w-full rounded-xl text-sm font-semibold disabled:opacity-45"
			>
				{remove.isPending ? "Closing goal…" : "Close goal and return savings"}
			</button>
			<button
				type="button"
				disabled={busy}
				onClick={() => setConfirming(false)}
				className="text-ink-muted h-10 w-full text-sm"
			>
				Keep goal
			</button>
		</div>
	);
}

export function GoalSettingsForm({
	goal,
	icon,
	onIconChange,
	onDone,
	onCancel,
}: {
	goal: Goal;
	icon: GoalIcon;
	onIconChange: (icon: GoalIcon) => void;
	onDone: (message: string) => void;
	onCancel: () => void;
}) {
	const [name, setName] = useState(goal.name);
	const [target, setTarget] = useState(
		goal.targetAmount ? String(toPesos(goal.targetAmount)) : "",
	);

	const update = api.goals.update.useMutation({
		onSuccess: () => onDone("Goal settings saved."),
	});

	const targetCentavos = toCentavos(Number(target));
	const noTarget = target.trim() === "";
	const targetError = goalAmountError(target, targetCentavos);
	const validTarget = noTarget || (targetCentavos > 0 && !targetError);
	const canSave = isValidGoalName(name) && validTarget && !update.isPending;

	const submit = () => {
		if (!canSave) return;

		update.mutate({
			id: goal.id,
			name: name.trim(),
			targetAmount: noTarget ? null : targetCentavos,
		});
	};

	return (
		<form
			className="bg-surface-raised mb-5 space-y-4 rounded-[22px] p-4"
			onSubmit={(event) => {
				event.preventDefault();
				submit();
			}}
		>
			<h2 className="text-lg font-bold">Goal settings</h2>

			<GoalIconPicker
				value={icon}
				onChange={onIconChange}
				disabled={update.isPending}
			/>

			<TextField
				label="Goal name"
				value={name}
				onChange={(event) => setName(event.target.value)}
				required
				maxLength={GOAL_NAME_MAX}
				disabled={update.isPending}
			/>

			<TextField
				label="Savings target"
				optional
				value={target}
				inputMode="decimal"
				prefix="₱"
				disabled={update.isPending}
				hint="Leave blank to remove your target."
				error={targetError}
				onChange={(event) => {
					if (isPesoInput(event.target.value)) setTarget(event.target.value);
				}}
			/>

			<FormError error={errorMessage(update.error)} />

			<Button type="submit" disabled={!canSave}>
				{update.isPending ? "Saving…" : "Save settings"}
			</Button>

			<CloseGoal
				goalId={goal.id}
				balance={goal.balance}
				disabled={update.isPending}
			/>

			<button
				type="button"
				disabled={update.isPending}
				onClick={onCancel}
				className="text-ink-muted hover:text-ink h-11 w-full rounded-xl text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-4"
			>
				Cancel
			</button>
		</form>
	);
}
