"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
	FormError,
	MoneyReceipt,
} from "~/features/transfers/components/money-form-ui";
import { isPesoInput } from "~/shared/lib/amount-input";
import {
	formatMobile,
	normaliseMobile,
	validateMobile,
} from "~/shared/lib/contact";
import { cn } from "~/shared/lib/cn";
import { dateTime, peso, digitsOnly } from "~/shared/lib/format";
import { toCentavos } from "~/shared/lib/money";
import { BackButton } from "~/shared/ui/back-button";
import { Button } from "~/shared/ui/button";
import { TextField } from "~/shared/ui/text-field";
import { TransactionSummary } from "~/shared/ui/transaction-summary";
import { errorMessage } from "~/trpc/error-message";
import { api } from "~/trpc/react";
import { MAX_LOAD_CENTAVOS, MIN_LOAD_CENTAVOS } from "../wallet.rules";

const LOAD_PRESETS = [10, 15, 20, 50, 100, 300, 500, 1000];

export function LoadForm() {
	const router = useRouter();
	const utils = api.useUtils();
	const [mobile, setMobile] = useState("");
	const [amount, setAmount] = useState("");
	const [reviewing, setReviewing] = useState(false);
	const load = api.wallet.load.useMutation({
		onSuccess: () => utils.account.invalidate(),
	});
	const amountCentavos = toCentavos(Number(amount));
	const validAmount =
		amountCentavos >= MIN_LOAD_CENTAVOS && amountCentavos <= MAX_LOAD_CENTAVOS;
	const validDetails =
		Boolean(mobile) && !validateMobile(mobile) && validAmount;
	const amountRange = `${peso(MIN_LOAD_CENTAVOS)}–${peso(MAX_LOAD_CENTAVOS)}`;
	const amountError =
		amount && Number.isFinite(amountCentavos) && !validAmount
			? `Use an amount from ${amountRange}`
			: null;

	const done = () => {
		router.push("/dashboard");
		router.refresh();
	};

	if (load.data) {
		return (
			<MoneyReceipt title="Load purchased" onDone={done}>
				<TransactionSummary
					amount={Math.abs(load.data.amount)}
					details={[
						{ label: "Mobile", value: formatMobile(mobile) },
						{ label: "Reference", value: load.data.reference },
						{ label: "Date", value: dateTime(load.data.createdAt) },
						{ label: "Points earned", value: `+${load.data.points}` },
						{ label: "Balance", value: peso(load.data.balanceAfter) },
					]}
				/>
			</MoneyReceipt>
		);
	}

	return (
		<div className="flex flex-1 flex-col">
			<header className="relative flex h-14 shrink-0 items-center justify-center">
				{reviewing ? (
					<BackButton
						onClick={() => {
							load.reset();
							setReviewing(false);
						}}
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
			{reviewing ? (
				<div className="flex flex-1 flex-col pt-7">
					<TransactionSummary
						amount={amountCentavos}
						details={[{ label: "Mobile", value: formatMobile(mobile) }]}
					/>
					<FormError error={load.error ? errorMessage(load.error) : null} />
					<div className="mt-auto pt-8">
						<Button
							disabled={load.isPending}
							onClick={() => {
								if (!validDetails || load.isPending) return;
								load.mutate({ mobile, amount: amountCentavos });
							}}
						>
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
						autoComplete="tel-national"
						value={mobile}
						placeholder="09XXXXXXXXX"
						onChange={(event) =>
							setMobile(digitsOnly(normaliseMobile(event.target.value), 11))
						}
					/>
					<section>
						<TextField
							label="Amount"
							inputMode="decimal"
							value={amount}
							prefix="₱"
							placeholder="0.00"
							hint={amountRange}
							error={amountError}
							onChange={(event) => {
								if (isPesoInput(event.target.value))
									setAmount(event.target.value);
							}}
						/>
						<div
							className="mt-4 grid grid-cols-4 gap-2"
							aria-label="Load amounts"
						>
							{LOAD_PRESETS.map((value) => (
								<button
									key={value}
									type="button"
									aria-pressed={amountCentavos === toCentavos(value)}
									onClick={() => setAmount(String(value))}
									className={cn(
										"h-12 rounded-xl border px-2 text-[13px] font-medium transition-colors",
										amountCentavos === toCentavos(value)
											? "border-brand bg-brand-soft text-brand"
											: "border-line bg-surface-sunken text-ink hover:bg-surface-raised",
									)}
								>
									₱{value.toLocaleString("en-PH")}
								</button>
							))}
						</div>
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
