"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { isPesoInput } from "~/shared/lib/amount-input";
import { cn } from "~/shared/lib/cn";
import {
	formatMobile,
	normalizeMobile,
	validateMobile,
} from "~/shared/lib/contact";
import { dateTime, digitsOnly, peso } from "~/shared/lib/format";
import { toCentavos } from "~/shared/lib/money";
import { BackButton } from "~/shared/ui/back-button";
import { Button } from "~/shared/ui/button";
import { FormError } from "~/shared/ui/money-form-ui";
import { TextField } from "~/shared/ui/text-field";
import { TransactionReceipt } from "~/shared/ui/transaction-receipt";
import { TransactionSummary } from "~/shared/ui/transaction-summary";
import { errorMessage } from "~/trpc/error-message";
import { api } from "~/trpc/react";
import { useSpendLimit } from "~/shared/hooks/use-spend-limit";
import { CardLockedNotice } from "~/features/card/components/card-locked-notice";
import { CardPicker } from "~/features/card/components/card-picker";
import { paidWithDetail } from "~/features/card/card-label";
import { MAX_LOAD_CENTAVOS, MIN_LOAD_CENTAVOS } from "../load.rules";

const LOAD_PRESETS = [10, 15, 20, 50, 100, 300, 500, 1000];
const MOBILE_LENGTH = 11;

function LoadPresets({
	selectedCentavos,
	onPick,
}: {
	selectedCentavos: number;
	onPick: (pesos: number) => void;
}) {
	return (
		<div className="mt-4 grid grid-cols-4 gap-2" aria-label="Load amounts">
			{LOAD_PRESETS.map((pesos) => {
				const selected = selectedCentavos === toCentavos(pesos);

				return (
					<button
						key={pesos}
						type="button"
						aria-pressed={selected}
						onClick={() => onPick(pesos)}
						className={cn(
							"h-12 rounded-xl border px-2 text-[13px] font-medium transition-colors",
							selected
								? "border-brand bg-brand-soft text-brand"
								: "border-line bg-surface-sunken text-ink hover:bg-surface-raised",
						)}
					>
						₱{pesos.toLocaleString("en-PH")}
					</button>
				);
			})}
		</div>
	);
}

export function LoadForm() {
	const router = useRouter();
	const [mobile, setMobile] = useState("");
	const [amount, setAmount] = useState("");
	const [reviewing, setReviewing] = useState(false);

	const load = api.load.buy.useMutation();
	const limit = useSpendLimit(MAX_LOAD_CENTAVOS, MIN_LOAD_CENTAVOS);

	const amountCentavos = toCentavos(Number(amount));
	const mobileComplete = mobile.length === MOBILE_LENGTH;
	const mobileError = mobileComplete ? validateMobile(mobile) : null;
	const validDetails =
		mobileComplete && !mobileError && limit.valid(amountCentavos);

	const leaveReview = () => {
		load.reset();
		setReviewing(false);
	};

	const buyLoad = () => {
		if (!validDetails || load.isPending) return;

		load.mutate({ mobile, amount: amountCentavos, card: limit.card });
	};

	const finish = () => {
		router.push("/dashboard");
		router.refresh();
	};

	if (load.data) {
		return (
			<TransactionReceipt title="Load successful" onDone={finish}>
				<TransactionSummary
					amount={Math.abs(load.data.amount)}
					details={[
						{ label: "Mobile", value: formatMobile(mobile) },
						{ label: "Reference", value: load.data.reference },
						{ label: "Date", value: dateTime(load.data.createdAt) },
						{ label: "Balance", value: peso(load.data.balanceAfter) },
						...paidWithDetail(load.data.details),
					]}
				/>
			</TransactionReceipt>
		);
	}

	return (
		<div className="flex flex-1 flex-col">
			<header className="relative flex h-14 shrink-0 items-center justify-center">
				{reviewing ? (
					<BackButton
						onClick={leaveReview}
						disabled={load.isPending}
						className="absolute left-0"
					/>
				) : (
					<BackButton href="/dashboard" className="absolute left-0" />
				)}
				<h1 className="text-ink text-[16px] font-semibold">
					{reviewing ? "Review load" : "Buy load"}
				</h1>
			</header>

			{limit.locked && !load.isPending ? <CardLockedNotice /> : null}

			{reviewing ? (
				<div className="flex flex-1 flex-col pt-7">
					<TransactionSummary
						amount={amountCentavos}
						details={[{ label: "Mobile", value: formatMobile(mobile) }]}
					/>

					<CardPicker
						cards={limit.cards}
						value={limit.card}
						onChange={limit.setCard}
						disabled={load.isPending}
					/>

					<FormError error={errorMessage(load.error)} />

					<div className="mt-auto pt-8">
						<Button disabled={load.isPending} onClick={buyLoad}>
							{load.isPending ? "Buying…" : `Buy ${peso(amountCentavos)}`}
						</Button>
					</div>
				</div>
			) : (
				<form
					className="flex flex-1 flex-col gap-6 pt-7"
					onSubmit={(event) => {
						event.preventDefault();
						if (validDetails) setReviewing(true);
					}}
				>
					<TextField
						label="Mobile number"
						type="tel"
						inputMode="tel"
						value={mobile}
						error={mobileError}
						onChange={(event) =>
							setMobile(
								digitsOnly(normalizeMobile(event.target.value), MOBILE_LENGTH),
							)
						}
					/>

					<section>
						<TextField
							label="Amount"
							inputMode="decimal"
							value={amount}
							prefix="₱"
							hint={limit.hint}
							error={limit.check(amountCentavos)}
							onChange={(event) => {
								if (isPesoInput(event.target.value)) {
									setAmount(event.target.value);
								}
							}}
						/>
						<LoadPresets
							selectedCentavos={amountCentavos}
							onPick={(pesos) => setAmount(String(pesos))}
						/>
					</section>

					<div className="mt-auto pt-2">
						<Button type="submit" disabled={!validDetails}>
							Review
						</Button>
					</div>
				</form>
			)}
		</div>
	);
}
