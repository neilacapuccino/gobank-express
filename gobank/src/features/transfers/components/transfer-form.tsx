"use client";

import { ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { dateTime, peso } from "~/shared/lib/format";
import { MAX_TRANSACTION_CENTAVOS, toCentavos } from "~/shared/lib/money";
import { Button } from "~/shared/ui/button";
import { TransactionReceipt } from "~/shared/ui/transaction-receipt";
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
} from "~/shared/ui/money-form-ui";
import {
	useRecipientSearch,
	type Recipient,
} from "~/shared/hooks/use-recipient-search";
import { useSpendLimit } from "~/shared/hooks/use-spend-limit";
import { CardLockedNotice } from "~/features/card/components/card-locked-notice";
import { CardPicker } from "~/features/card/components/card-picker";
import { paidWithDetail } from "~/features/card/card-label";

function RecentRecipients({
	disabled,
	onSelect,
}: {
	disabled: boolean;
	onSelect: (recipient: Recipient) => void;
}) {
	const recent = api.transfers.recent.useQuery();

	if (recent.isPending) {
		return (
			<p role="status" className="text-ink-muted text-[13px]">
				Loading recent recipients…
			</p>
		);
	}

	if (recent.error) {
		return (
			<div className="text-[13px]">
				<p role="alert" className="text-danger">
					Could not load recent recipients.
				</p>
				<button
					type="button"
					disabled={recent.isFetching}
					onClick={() => void recent.refetch()}
					className="text-brand mt-2 font-medium disabled:opacity-60"
				>
					{recent.isFetching ? "Loading…" : "Try again"}
				</button>
			</div>
		);
	}

	if (recent.data.length === 0) {
		return (
			<p className="text-ink-muted text-[13px]">No recent recipients yet.</p>
		);
	}

	return (
		<ul className="border-line divide-line divide-y rounded-2xl border">
			{recent.data.map((recipient) => (
				<li key={recipient.id}>
					<button
						type="button"
						disabled={disabled}
						onClick={() => onSelect(recipient)}
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
	);
}

export function TransferForm() {
	const router = useRouter();
	const [step, setStep] = useState<MoneyStep>("recipient");
	const [amount, setAmount] = useState("");
	const [note, setNote] = useState("");

	const search = useRecipientSearch(() => setStep("amount"));
	const limit = useSpendLimit(MAX_TRANSACTION_CENTAVOS);
	const send = api.transfers.send.useMutation();

	const amountCentavos = toCentavos(Number(amount));
	const validAmount = limit.valid(amountCentavos);
	const recipient = search.recipient;

	const back = () => {
		send.reset();
		setStep(step === "review" ? "amount" : "recipient");
	};

	const finish = () => {
		router.push("/dashboard");
		router.refresh();
	};

	const sendMoney = () => {
		if (!recipient || !validAmount || send.isPending) return;

		send.mutate({
			to: `@${recipient.username}`,
			amount: amountCentavos,
			note: note.trim(),
			card: limit.card,
		});
	};

	if (send.data && recipient) {
		return (
			<TransactionReceipt title="Transfer successful" onDone={finish}>
				<MoneySummary
					recipient={recipient}
					amount={Math.abs(send.data.amount)}
					note={note.trim()}
					details={[
						{ label: "Reference", value: send.data.reference },
						{ label: "Date", value: dateTime(send.data.createdAt) },
						{ label: "Balance", value: peso(send.data.balanceAfter) },
						...paidWithDetail(send.data.details),
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

			{limit.locked && !send.isPending ? <CardLockedNotice /> : null}

			{step === "recipient" ? (
				<RecipientPicker
					value={search.value}
					loading={search.loading}
					recipient={search.match}
					error={search.error}
					onChange={search.change}
					onContinue={search.find}
					onRetry={search.retry}
				>
					<section className="mt-7">
						<h2 className="text-ink-muted mb-3 text-[13px] font-medium">
							Recent recipients
						</h2>
						<RecentRecipients
							disabled={search.loading}
							onSelect={search.select}
						/>
					</section>
				</RecipientPicker>
			) : null}

			{step === "amount" && recipient ? (
				<AmountFields
					recipient={recipient}
					amount={amount}
					note={note}
					hint={limit.hint}
					error={limit.check(amountCentavos)}
					canContinue={validAmount}
					onAmountChange={setAmount}
					onNoteChange={setNote}
					onContinue={() => {
						if (validAmount) setStep("review");
					}}
				/>
			) : null}

			{step === "review" && recipient ? (
				<div className="flex flex-1 flex-col pt-7">
					<MoneySummary
						recipient={recipient}
						amount={amountCentavos}
						note={note.trim()}
					/>

					<CardPicker
						cards={limit.cards}
						value={limit.card}
						onChange={limit.setCard}
						disabled={send.isPending}
					/>

					<FormError error={errorMessage(send.error)} />

					<div className="mt-auto pt-8">
						<Button disabled={send.isPending} onClick={sendMoney}>
							{send.isPending ? "Sending…" : `Send ${peso(amountCentavos)}`}
						</Button>
					</div>
				</div>
			) : null}
		</div>
	);
}
