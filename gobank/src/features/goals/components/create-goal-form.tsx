"use client";

import { useState } from "react";
import { isPesoInput } from "~/shared/lib/amount-input";
import { MAX_TRANSACTION_CENTAVOS, toCentavos } from "~/shared/lib/money";
import { BackButton } from "~/shared/ui/back-button";
import { Button } from "~/shared/ui/button";
import { TextField } from "~/shared/ui/text-field";
import { errorMessage } from "~/trpc/error-message";
import { api, type RouterOutputs } from "~/trpc/react";
import { saveGoalIcon } from "../hooks/use-goal-icon";
import { isValidGoalName, GOAL_NAME_MAX } from "../goals.rules";
import type { GoalIcon } from "./goal-art";
import { GoalIconPicker } from "./goal-icon-picker";

type Step = "name" | "target";

const TARGET_RANGE_ERROR =
	"Enter ₱0.01 to ₱1,000,000, with up to two decimal places.";

const CARD_CLASS =
	"animate-step-in bg-surface mt-8 rounded-[24px] border border-white/[.07] p-5";

function targetIsValid(typed: string, centavos: number | null) {
	if (centavos === null) return true;

	return (
		isPesoInput(typed) && centavos > 0 && centavos <= MAX_TRANSACTION_CENTAVOS
	);
}

function submitLabel(pending: boolean, step: Step) {
	if (pending) return "Creating…";
	return step === "name" ? "Continue" : "Create goal";
}

export function CreateGoalForm({
	onCreated,
	onCancel,
}: {
	onCreated: (goal: RouterOutputs["goals"]["create"]) => void;
	onCancel: () => void;
}) {
	const [name, setName] = useState("");
	const [target, setTarget] = useState("");
	const [icon, setIcon] = useState<GoalIcon>("safe");
	const [step, setStep] = useState<Step>("name");

	const create = api.goals.create.useMutation({
		onSuccess: (goal) => {
			saveGoalIcon(goal.id, icon);
			onCreated(goal);
		},
	});

	const typedTarget = target.trim();
	const targetCentavos = typedTarget ? toCentavos(Number(typedTarget)) : null;
	const validTarget = targetIsValid(typedTarget, targetCentavos);
	const validName = isValidGoalName(name);

	const canSubmit =
		validName && (step === "name" || validTarget) && !create.isPending;

	const submit = () => {
		if (!canSubmit) return;

		if (step === "name") {
			setStep("target");
			return;
		}

		create.mutate({ name: name.trim(), targetAmount: targetCentavos });
	};

	const goBack = () => {
		if (step === "name") onCancel();
		else setStep("name");
	};

	return (
		<form
			className="bg-surface-sunken text-ink -mx-6 -mt-8 -mb-10 flex min-h-[calc(100dvh-1px)] flex-1 flex-col px-5 pt-7 pb-8"
			onSubmit={(event) => {
				event.preventDefault();
				submit();
			}}
		>
			<header className="relative flex min-h-11 items-center justify-center">
				<BackButton
					disabled={create.isPending}
					label={step === "name" ? "Back to GoalSave" : "Back to goal name"}
					onClick={goBack}
					className="absolute left-0"
				/>
				<h1 className="text-[17px] font-semibold">New goal</h1>
			</header>

			<div className="mt-9">
				<GoalIconPicker
					value={icon}
					onChange={setIcon}
					disabled={create.isPending}
				/>
			</div>

			{step === "name" ? (
				<div className={CARD_CLASS}>
					<TextField
						key="name"
						label="Goal name"
						value={name}
						onChange={(event) => setName(event.target.value)}
						required
						maxLength={GOAL_NAME_MAX}
						disabled={create.isPending}
						autoFocus
						hint={`${name.length}/${GOAL_NAME_MAX}`}
					/>
				</div>
			) : (
				<div className={CARD_CLASS}>
					<h2 className="mb-5 text-[18px] font-semibold tracking-tight break-words">
						{name}
					</h2>
					<TextField
						key="target"
						label="Target amount"
						optional
						prefix="₱"
						inputMode="decimal"
						value={target}
						onChange={(event) => {
							if (isPesoInput(event.target.value))
								setTarget(event.target.value);
						}}
						disabled={create.isPending}
						autoFocus
						aria-invalid={!validTarget}
						error={validTarget ? null : TARGET_RANGE_ERROR}
						hint="Leave blank for no target."
					/>
				</div>
			)}

			{create.error ? (
				<p
					role="alert"
					className="bg-danger-soft text-danger mt-5 rounded-2xl p-3 text-sm"
				>
					{errorMessage(create.error)}
				</p>
			) : null}

			<div className="mt-auto pt-10">
				<Button type="submit" disabled={!canSubmit}>
					{submitLabel(create.isPending, step)}
				</Button>
			</div>
		</form>
	);
}
