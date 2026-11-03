"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
	AmountFields,
	FormError,
	MoneyFormHeader,
	MoneySummary,
	RecipientPicker,
	type MoneyStep,
} from "~/shared/ui/money-form-ui";
import { useRecipientSearch } from "~/shared/hooks/use-recipient-search";
import { dateTime, peso } from "~/shared/lib/format";
import { toCentavos } from "~/shared/lib/money";
import { Button } from "~/shared/ui/button";
import { TransactionReceipt } from "~/shared/ui/transaction-receipt";
import { errorMessage } from "~/trpc/error-message";
import { api } from "~/trpc/react";
import { MAX_REQUEST_CENTAVOS } from "../requests.rules";

export function RequestForm() {
	const router = useRouter();
	const [step, setStep] = useState<MoneyStep>("recipient");
	const [amount, setAmount] = useState("");
	const [note, setNote] = useState("");

	const search = useRecipientSearch(() => setStep("amount"));
	const request = api.requests.create.useMutation();

	const amountCentavos = toCentavos(Number(amount));
	const overLimit = amountCentavos > MAX_REQUEST_CENTAVOS;
	const validAmount = amountCentavos > 0 && !overLimit;
	const payer = search.recipient;

	const back = () => {
		request.reset();
		setStep(step === "review" ? "amount" : "recipient");
	};

	const sendRequest = () => {
		if (!payer || !validAmount || request.isPending) return;

		request.mutate({
			from: `@${payer.username}`,
			amount: amountCentavos,
			note: note.trim(),
		});
	};

	const finish = () => {
		router.push("/dashboard");
		router.refresh();
	};

	if (request.data && payer) {
		return (
			<TransactionReceipt title="Request sent" onDone={finish}>
				<MoneySummary
					recipient={payer}
					amount={request.data.amount}
					note={note.trim()}
					details={[
						{ label: "Status", value: "Pending" },
						{ label: "Date", value: dateTime(request.data.createdAt) },
					]}
				/>
			</TransactionReceipt>
		);
	}

	return (
		<div className="flex flex-1 flex-col">
			<MoneyFormHeader
				title="Request money"
				step={step}
				disabled={request.isPending}
				onBack={back}
			/>

			{step === "recipient" ? (
				<RecipientPicker
					label="Request from"
					value={search.value}
					loading={search.loading}
					recipient={search.match}
					error={search.error}
					onChange={search.change}
					onContinue={search.find}
					onRetry={search.retry}
				/>
			) : null}

			{step === "amount" && payer ? (
				<AmountFields
					recipient={payer}
					amount={amount}
					note={note}
					hint={`Up to ${peso(MAX_REQUEST_CENTAVOS)}`}
					error={overLimit ? `Maximum ${peso(MAX_REQUEST_CENTAVOS)}` : null}
					canContinue={validAmount}
					onAmountChange={setAmount}
					onNoteChange={setNote}
					onContinue={() => {
						if (validAmount) setStep("review");
					}}
				/>
			) : null}

			{step === "review" && payer ? (
				<div className="flex flex-1 flex-col pt-7">
					<MoneySummary
						recipient={payer}
						amount={amountCentavos}
						note={note.trim()}
					/>

					<FormError error={errorMessage(request.error)} />

					<div className="mt-auto pt-8">
						<Button disabled={request.isPending} onClick={sendRequest}>
							{request.isPending
								? "Sending…"
								: `Request ${peso(amountCentavos)}`}
						</Button>
					</div>
				</div>
			) : null}
		</div>
	);
}
