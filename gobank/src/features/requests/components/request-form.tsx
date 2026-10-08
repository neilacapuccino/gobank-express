"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
	AmountFields,
	FormError,
	MoneyFormHeader,
	MoneyReceipt,
	MoneySummary,
	RecipientPicker,
	type MoneyStep,
} from "~/features/transfers/components/money-form-ui";
import { useRecipientSearch } from "~/features/transfers/components/use-recipient-search";
import { dateTime, peso } from "~/shared/lib/format";
import { toCentavos } from "~/shared/lib/money";
import { Button } from "~/shared/ui/button";
import { errorMessage } from "~/trpc/error-message";
import { api } from "~/trpc/react";
import { MAX_REQUEST_CENTAVOS } from "../requests.rules";

export function RequestForm() {
	const router = useRouter();
	const utils = api.useUtils();
	const [step, setStep] = useState<MoneyStep>("recipient");
	const [amount, setAmount] = useState("");
	const [note, setNote] = useState("");
	const search = useRecipientSearch(() => setStep("amount"));
	const request = api.requests.create.useMutation({
		onSuccess: () => utils.requests.invalidate(),
	});
	const amountCentavos = toCentavos(Number(amount));
	const validAmount =
		amountCentavos > 0 && amountCentavos <= MAX_REQUEST_CENTAVOS;

	const back = () => {
		request.reset();
		setStep(step === "review" ? "amount" : "recipient");
	};
	const done = () => {
		router.push("/dashboard");
		router.refresh();
	};

	if (request.data && search.recipient) {
		return (
			<MoneyReceipt title="Request sent" onDone={done}>
				<MoneySummary
					recipient={search.recipient}
					amount={request.data.amount}
					note={note.trim()}
					details={[
						{ label: "Status", value: "Pending" },
						{ label: "Date", value: dateTime(request.data.createdAt) },
					]}
				/>
			</MoneyReceipt>
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
					error={search.error}
					onChange={search.change}
					onContinue={() => void search.find()}
				/>
			) : step === "amount" && search.recipient ? (
				<AmountFields
					recipient={search.recipient}
					amount={amount}
					note={note}
					maximum={MAX_REQUEST_CENTAVOS}
					onAmountChange={setAmount}
					onNoteChange={setNote}
					onContinue={() => {
						if (validAmount) setStep("review");
					}}
				/>
			) : step === "review" && search.recipient ? (
				<div className="flex flex-1 flex-col pt-7">
					<MoneySummary
						recipient={search.recipient}
						amount={amountCentavos}
						note={note.trim()}
					/>
					<FormError
						error={request.error ? errorMessage(request.error) : null}
					/>
					<div className="mt-auto pt-8">
						<Button
							disabled={request.isPending}
							onClick={() => {
								if (!search.recipient || !validAmount || request.isPending)
									return;
								request.mutate({
									from: `@${search.recipient.username}`,
									amount: amountCentavos,
									note: note.trim(),
								});
							}}
						>
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
