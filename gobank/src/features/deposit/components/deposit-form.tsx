"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { isPesoInput } from "~/shared/lib/amount-input";
import { dateTime, peso } from "~/shared/lib/format";
import { toCentavos } from "~/shared/lib/money";
import { Button } from "~/shared/ui/button";
import { FormError } from "~/shared/ui/money-form-ui";
import { PageHeader } from "~/shared/ui/page-header";
import { TextField } from "~/shared/ui/text-field";
import { TransactionReceipt } from "~/shared/ui/transaction-receipt";
import { TransactionSummary } from "~/shared/ui/transaction-summary";
import { errorMessage } from "~/trpc/error-message";
import { api } from "~/trpc/react";
import { MAX_DEPOSIT_CENTAVOS } from "../deposit.rules";

export function DepositForm() {
	const router = useRouter();
	const [amount, setAmount] = useState("");
	const deposit = api.deposit.create.useMutation();

	const amountCentavos = toCentavos(Number(amount));
	const overLimit = amountCentavos > MAX_DEPOSIT_CENTAVOS;
	const validAmount = amountCentavos > 0 && !overLimit;

	const submit = () => {
		if (validAmount && !deposit.isPending) {
			deposit.mutate({ amount: amountCentavos });
		}
	};

	const finish = () => {
		router.push("/dashboard");
		router.refresh();
	};

	if (deposit.data) {
		return (
			<TransactionReceipt title="Deposit successful" onDone={finish}>
				<TransactionSummary
					amount={deposit.data.amount}
					details={[
						{ label: "Reference", value: deposit.data.reference },
						{ label: "Date", value: dateTime(deposit.data.createdAt) },
						{ label: "Balance after", value: peso(deposit.data.balanceAfter) },
					]}
				/>
			</TransactionReceipt>
		);
	}

	return (
		<form
			className="flex flex-1 flex-col gap-7"
			onSubmit={(event) => {
				event.preventDefault();
				submit();
			}}
		>
			<PageHeader title="Deposit" back="/dashboard" />

			<TextField
				label="Amount (PHP)"
				inputMode="decimal"
				value={amount}
				disabled={deposit.isPending}
				aria-invalid={overLimit}
				hint={`${overLimit ? "Maximum" : "Up to"} ${peso(MAX_DEPOSIT_CENTAVOS)}`}
				onChange={(event) => {
					if (isPesoInput(event.target.value)) setAmount(event.target.value);
				}}
			/>

			<FormError error={errorMessage(deposit.error)} />

			<div className="mt-auto pt-4">
				<Button type="submit" disabled={!validAmount || deposit.isPending}>
					{deposit.isPending ? "Depositing…" : "Deposit"}
				</Button>
			</div>
		</form>
	);
}
