"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
	FormError,
	MoneyReceipt,
} from "~/features/transfers/components/money-form-ui";
import { isPesoInput } from "~/shared/lib/amount-input";
import { dateTime, peso } from "~/shared/lib/format";
import { toCentavos } from "~/shared/lib/money";
import { Button } from "~/shared/ui/button";
import { PageHeader } from "~/shared/ui/page-header";
import { TextField } from "~/shared/ui/text-field";
import { TransactionSummary } from "~/shared/ui/transaction-summary";
import { errorMessage } from "~/trpc/error-message";
import { api } from "~/trpc/react";
import { MAX_DEPOSIT_CENTAVOS } from "../wallet.rules";

export function DepositForm() {
	const router = useRouter();
	const utils = api.useUtils();
	const [amount, setAmount] = useState("");
	const deposit = api.wallet.deposit.useMutation({
		onSuccess: () => void utils.account.invalidate(),
	});
	const amountCentavos = toCentavos(Number(amount));
	const exceedsLimit = amountCentavos > MAX_DEPOSIT_CENTAVOS;
	const validAmount = amountCentavos > 0 && !exceedsLimit;

	if (deposit.data) {
		return (
			<MoneyReceipt
				title="Deposit complete"
				onDone={() => {
					router.push("/dashboard");
					router.refresh();
				}}
			>
				<TransactionSummary
					amount={deposit.data.amount}
					details={[
						{ label: "Reference", value: deposit.data.reference },
						{ label: "Date", value: dateTime(deposit.data.createdAt) },
						{ label: "Balance after", value: peso(deposit.data.balanceAfter) },
					]}
				/>
			</MoneyReceipt>
		);
	}

	return (
		<form
			className="flex flex-1 flex-col gap-7"
			onSubmit={(event) => {
				event.preventDefault();
				if (validAmount && !deposit.isPending)
					deposit.mutate({ amount: amountCentavos });
			}}
		>
			<PageHeader title="Deposit" back="/dashboard" />
			<TextField
				label="Amount (PHP)"
				inputMode="decimal"
				placeholder="0.00"
				value={amount}
				disabled={deposit.isPending}
				aria-invalid={exceedsLimit}
				hint={`${exceedsLimit ? "Maximum" : "Up to"} ${peso(MAX_DEPOSIT_CENTAVOS)}`}
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
