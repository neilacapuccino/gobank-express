"use client";

import { useState } from "react";
import { isPesoInput } from "~/shared/lib/amount-input";
import { peso } from "~/shared/lib/format";
import { MAX_TRANSACTION_CENTAVOS, toCentavos } from "~/shared/lib/money";
import { Button } from "~/shared/ui/button";
import { FormError } from "~/shared/ui/money-form-ui";
import { TextField } from "~/shared/ui/text-field";
import { errorMessage } from "~/trpc/error-message";
import { api } from "~/trpc/react";
import { goalAmountError, type GoalTransfer } from "../goals.rules";

const TITLE: Record<GoalTransfer, string> = {
	in: "Transfer in",
	out: "Transfer out",
};

function transferHint(
	direction: GoalTransfer,
	goalBalance: number,
	mainBalance: number | undefined,
) {
	if (direction === "out") return `Available: ${peso(goalBalance)}`;
	if (mainBalance === undefined) return "Move money from your main balance.";

	return `From your main balance of ${peso(mainBalance)}`;
}

export function GoalTransferForm({
	goalId,
	goalBalance,
	direction,
	onDone,
	onCancel,
}: {
	goalId: string;
	goalBalance: number;
	direction: GoalTransfer;
	onDone: (message: string) => void;
	onCancel: () => void;
}) {
	const [amount, setAmount] = useState("");
	const spending = api.account.spending.useQuery();
	const move = api.goals.move.useMutation({
		onSuccess: () => onDone("Transfer complete."),
	});

	const mainBalance = spending.data?.balance;
	const available =
		direction === "out"
			? goalBalance
			: (mainBalance ?? MAX_TRANSACTION_CENTAVOS);

	const centavos = toCentavos(Number(amount));
	const error = goalAmountError(amount, centavos, available, direction);
	const valid = centavos > 0 && !error;

	const hint = transferHint(direction, goalBalance, mainBalance);

	const submit = () => {
		if (!valid || move.isPending) return;

		move.mutate({ id: goalId, amount: centavos, direction });
	};

	return (
		<form
			className="bg-surface-raised mb-5 space-y-4 rounded-[22px] p-4"
			onSubmit={(event) => {
				event.preventDefault();
				submit();
			}}
		>
			<h2 className="text-lg font-bold">{TITLE[direction]}</h2>

			<TextField
				label="Amount"
				value={amount}
				inputMode="decimal"
				prefix="₱"
				disabled={move.isPending}
				hint={hint}
				error={error}
				onChange={(event) => {
					if (isPesoInput(event.target.value)) setAmount(event.target.value);
				}}
			/>

			<FormError error={errorMessage(move.error)} />

			<Button type="submit" disabled={move.isPending || !valid}>
				{move.isPending ? "Saving…" : "Confirm transfer"}
			</Button>

			<button
				type="button"
				disabled={move.isPending}
				onClick={onCancel}
				className="text-ink-muted hover:text-ink h-11 w-full rounded-xl text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-4"
			>
				Cancel
			</button>
		</form>
	);
}
