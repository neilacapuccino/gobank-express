"use client";

import { useState } from "react";
import { isPesoInput } from "~/shared/lib/amount-input";
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
	targetAmount: number | null;
};

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
	onDone: () => void;
	onCancel: () => void;
}) {
	const [name, setName] = useState(goal.name);
	const [target, setTarget] = useState(
		goal.targetAmount ? String(toPesos(goal.targetAmount)) : "",
	);

	const update = api.goals.update.useMutation({
		onSuccess: () => onDone(),
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
