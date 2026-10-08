"use client";

import { ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { TransactionReceipt } from "~/shared/ui/transaction-receipt";
import { useState } from "react";
import { dateTime, peso } from "~/shared/lib/format";
import { MAX_TRANSACTION_CENTAVOS, toCentavos } from "~/shared/lib/money";
import { Button } from "~/shared/ui/button";
import { errorMessage } from "~/trpc/error-message";
import { api } from "~/trpc/react";
import {
	AmountFields,
	FormError,
	MoneyFormHeader,
	MoneySummary,
	RecipientIdentity,
	RecipientPicker,
	type MoneyStep,
} from "./money-form-ui";
import { useRecipientSearch } from "./use-recipient-search";

export function TransferForm() {
	const router = useRouter();
	const utils = api.useUtils();
	const [step, setStep] = useState<MoneyStep>("recipient");
	const [amount, setAmount] = useState("");
	const [note, setNote] = useState("");
	const search = useRecipientSearch(() => setStep("amount"));
	const recent = api.transfers.recent.useQuery();
	const send = api.transfers.send.useMutation({
		onSuccess: async () => {
			await Promise.all([
				utils.account.invalidate(),
				utils.transfers.recent.invalidate(),
			]);
		},
	});
	const amountCentavos = toCentavos(Number(amount));
	const validAmount =
		amountCentavos > 0 && amountCentavos <= MAX_TRANSACTION_CENTAVOS;

	const back = () => {
		send.reset();
		setStep(step === "review" ? "amount" : "recipient");
	};
	const done = () => {
		router.push("/dashboard");
		router.refresh();
	};

	if (send.data && search.recipient) {
		return (
			<TransactionReceipt title="Money sent" onDone={done}>
				<MoneySummary
					recipient={search.recipient}
					amount={Math.abs(send.data.amount)}
					note={note.trim()}
					details={[
						{ label: "Reference", value: send.data.reference },
						{ label: "Date", value: dateTime(send.data.createdAt) },
						{ label: "Balance", value: peso(send.data.balanceAfter) },
					]}
				/>
			</TransactionReceipt>
		);
	}

	return (
		<div className="flex flex-1 flex-col">
			<MoneyFormHeader
				title="Send money"
				step={step}
				disabled={send.isPending}
				onBack={back}
			/>
			{step === "recipient" ? (
				<RecipientPicker
					value={search.value}
					loading={search.loading}
					error={search.error}
					onChange={search.change}
					onContinue={() => void search.find()}
				>
					{recent.data?.length ? (
						<section className="mt-7">
							<h2 className="text-ink-muted mb-3 text-[13px] font-medium">
								Recent recipients
							</h2>
							<ul className="border-line divide-line divide-y rounded-2xl border">
								{recent.data.map((recipient) => (
									<li key={recipient.id}>
										<button
											type="button"
											disabled={search.loading}
											onClick={() => void search.find(`@${recipient.username}`)}
											className="hover:bg-surface-sunken flex w-full items-center justify-between gap-3 rounded-xl p-3 text-left transition-colors disabled:opacity-60"
										>
											<RecipientIdentity recipient={recipient} />
											<ChevronRight
												size={18}
												className="text-ink-muted shrink-0"
												aria-hidden
											/>
										</button>
									</li>
								))}
							</ul>
						</section>
					) : null}
				</RecipientPicker>
			) : step === "amount" && search.recipient ? (
				<AmountFields
					recipient={search.recipient}
					amount={amount}
					note={note}
					maximum={MAX_TRANSACTION_CENTAVOS}
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
					<FormError error={send.error ? errorMessage(send.error) : null} />
					<div className="mt-auto pt-8">
						<Button
							disabled={send.isPending}
							onClick={() => {
								if (!search.recipient || !validAmount || send.isPending) return;
								send.mutate({
									to: `@${search.recipient.username}`,
									amount: amountCentavos,
									note: note.trim(),
								});
							}}
						>
							{send.isPending ? "Sending…" : `Send ${peso(amountCentavos)}`}
						</Button>
					</div>
				</div>
			) : null}
		</div>
	);
}
