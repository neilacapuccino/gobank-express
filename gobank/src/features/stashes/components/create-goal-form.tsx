"use client";
import { useState } from "react";
import { BackButton } from "~/shared/ui/back-button";
import { TextField } from "~/shared/ui/text-field";
import { toCentavos } from "~/shared/lib/money";
import { errorMessage } from "~/trpc/error-message";
import { api, type RouterOutputs } from "~/trpc/react";
import { GoalIconPicker } from "./goal-icon-picker";
import { type GoalIcon } from "./goal-art";
import { saveGoalIcon } from "./goal-icon-preference";

export function CreateGoalForm({
	onCreated,
	onCancel,
}: {
	onCreated: (goal: RouterOutputs["stashes"]["create"]) => void;
	onCancel: () => void;
}) {
	const [name, setName] = useState("");
	const [target, setTarget] = useState("");
	const [icon, setIcon] = useState<GoalIcon>("safe");
	const [step, setStep] = useState<"name" | "target">("name");
	const create = api.stashes.create.useMutation({
		onSuccess: (goal) => {
			saveGoalIcon(goal.id, icon);
			onCreated(goal);
		},
	});
	const amount = target.trim();
	const goal = amount ? toCentavos(Number(amount)) : null;
	const validTarget =
		goal === null ||
		(/^\d+(\.\d{1,2})?$/.test(amount) && goal > 0 && goal <= 100_000_000);
	const validName = name.trim().length > 0 && name.trim().length <= 40;
	return (
		<form
			className="bg-surface-sunken text-ink -mx-6 -mt-8 -mb-10 flex min-h-[calc(100dvh-1px)] flex-1 flex-col px-5 pt-7 pb-8"
			onSubmit={(event) => {
				event.preventDefault();
				if (!validName || create.isPending) return;
				if (step === "name") {
					setStep("target");
					return;
				}
				if (validTarget) create.mutate({ name: name.trim(), goal });
			}}
		>
			<header className="relative flex min-h-11 items-center justify-center">
				<BackButton
					disabled={create.isPending}
					label={step === "name" ? "Back to GoalSave" : "Back to goal name"}
					onClick={() => (step === "name" ? onCancel() : setStep("name"))}
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
				<div className="animate-step-in mt-8 rounded-[24px] border border-white/[.07] bg-[#1b1b1d] p-5">
					<TextField
						key="name"
						label="Goal name"
						value={name}
						onChange={(event) => setName(event.target.value)}
						required
						maxLength={40}
						disabled={create.isPending}
						autoFocus
						placeholder="e.g. Emergency fund"
						hint={`${name.length}/40`}
					/>
				</div>
			) : (
				<div className="animate-step-in mt-8 rounded-[24px] border border-white/[.07] bg-[#1b1b1d] p-5">
					<h2 className="mb-5 text-[18px] font-semibold tracking-tight break-words">
						{name}
					</h2>
					<TextField
						key="target"
						label="Target amount"
						optional
						prefix="₱"
						inputMode="decimal"
						placeholder="0.00"
						value={target}
						onChange={(event) => setTarget(event.target.value)}
						maxLength={12}
						disabled={create.isPending}
						autoFocus
						aria-invalid={!validTarget}
						error={
							!validTarget
								? "Enter ₱0.01 to ₱1,000,000, with up to two decimal places."
								: null
						}
						hint="Leave blank for no target."
					/>
				</div>
			)}
			{create.error && (
				<p
					role="alert"
					className="bg-danger-soft text-danger mt-5 rounded-2xl p-3 text-sm"
				>
					{errorMessage(create.error)}
				</p>
			)}
			<div className="mt-auto pt-10">
				<button
					type="submit"
					disabled={
						!validName ||
						(step === "target" && !validTarget) ||
						create.isPending
					}
					className="h-13 w-full rounded-2xl bg-[#71d5f3] text-[15px] font-semibold text-[#121214] transition-colors hover:bg-[#9ae1f7] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#71d5f3] disabled:bg-[#29292d] disabled:text-[#878792]"
				>
					{create.isPending
						? "Creating…"
						: step === "name"
							? "Continue"
							: "Create goal"}
				</button>
			</div>
		</form>
	);
}
