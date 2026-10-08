"use client";

import { useRouter } from "next/navigation";
import { TransactionReceipt } from "~/shared/ui/transaction-receipt";
import { useState } from "react";
import { FormError } from "~/features/transfers/components/money-form-ui";
import { isPesoInput } from "~/shared/lib/amount-input";
import { dateTime, digitsOnly, maskDigits, peso } from "~/shared/lib/format";
import { MAX_TRANSACTION_CENTAVOS, toCentavos } from "~/shared/lib/money";
import { BackButton } from "~/shared/ui/back-button";
import { Button } from "~/shared/ui/button";
import { TextField } from "~/shared/ui/text-field";
import { TransactionSummary } from "~/shared/ui/transaction-summary";
import { errorMessage } from "~/trpc/error-message";
import { api } from "~/trpc/react";
import { CATEGORIES, findCategory, type Category } from "../bill-categories";
import { BillerCard } from "./biller-card";
import { CategoryCard } from "./category-card";

export function BillPayment() {
	const router = useRouter();
	const utils = api.useUtils();
	const [categoryId, setCategoryId] = useState<Category | null>(null);
	const [billerId, setBillerId] = useState<string | null>(null);
	const [accountNumber, setAccountNumber] = useState("");
	const [amount, setAmount] = useState("");
	const [reviewing, setReviewing] = useState(false);
	const catalogue = api.bills.billers.useQuery();
	const pay = api.bills.pay.useMutation({
		onSuccess: () => utils.account.invalidate(),
	});
	const category = findCategory(categoryId);
	const billers =
		catalogue.data?.filter((item) => item.category === categoryId) ?? [];
	const biller = billers.find((item) => item.id === billerId);
	const amountCentavos = toCentavos(Number(amount));
	const exceedsLimit = amountCentavos > MAX_TRANSACTION_CENTAVOS;
	const validDetails =
		Boolean(biller) &&
		/^\d{4,20}$/.test(accountNumber) &&
		amountCentavos > 0 &&
		!exceedsLimit;

	const done = () => {
		router.push("/dashboard");
		router.refresh();
	};

	if (pay.data) {
		return (
			<TransactionReceipt title="Bill paid" onDone={done}>
				<TransactionSummary
					amount={Math.abs(pay.data.amount)}
					details={[
						{ label: "Account", value: maskDigits(accountNumber) },
						{ label: "Reference", value: pay.data.reference },
						{ label: "Date", value: dateTime(pay.data.createdAt) },
						{ label: "Points earned", value: `+${pay.data.points}` },
						{ label: "Balance", value: peso(pay.data.balanceAfter) },
					]}
				>
					<p className="text-ink text-[14px] font-medium">{biller?.name}</p>
				</TransactionSummary>
			</TransactionReceipt>
		);
	}

	return (
		<div className="flex flex-1 flex-col">
			<header className="relative flex h-14 shrink-0 items-center justify-center">
				{reviewing ? (
					<BackButton
						onClick={() => {
							pay.reset();
							setReviewing(false);
						}}
						disabled={pay.isPending}
						className="absolute left-0"
					/>
				) : (
					<BackButton href="/dashboard" className="absolute left-0" />
				)}
				<h1 className="text-ink text-[16px] font-semibold">
					{reviewing ? "Review bill" : "Pay bills"}
				</h1>
			</header>
			{reviewing && biller ? (
				<div className="flex flex-1 flex-col pt-7">
					<TransactionSummary
						amount={amountCentavos}
						details={[{ label: "Account", value: accountNumber }]}
					>
						<p className="text-ink text-[14px] font-medium">{biller.name}</p>
					</TransactionSummary>
					<FormError error={pay.error ? errorMessage(pay.error) : null} />
					<div className="mt-auto pt-8">
						<Button
							disabled={pay.isPending}
							onClick={() => {
								if (!validDetails || pay.isPending) return;
								pay.mutate({
									billerId: biller.id,
									accountNumber,
									amount: amountCentavos,
								});
							}}
						>
							{pay.isPending ? "Paying…" : `Pay ${peso(amountCentavos)}`}
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
					<section>
						<h2 className="text-ink mb-3 text-[14px] font-medium">Category</h2>
						<div className="grid grid-cols-2 gap-2">
							{CATEGORIES.map((item) => (
								<CategoryCard
									key={item.id}
									label={item.label}
									icon={item.icon}
									selected={categoryId === item.id}
									onClick={() => {
										if (categoryId === item.id) return;
										setCategoryId(item.id);
										setBillerId(null);
										setAccountNumber("");
										setAmount("");
									}}
								/>
							))}
						</div>
					</section>
					{category ? (
						<section>
							<h2 className="text-ink mb-3 text-[14px] font-medium">Biller</h2>
							{catalogue.isLoading ? (
								<p role="status" className="text-ink-muted text-[13px]">
									Loading billers…
								</p>
							) : catalogue.error ? (
								<div>
									<FormError error={errorMessage(catalogue.error)} />
									<Button
										type="button"
										variant="ghost"
										onClick={() => void catalogue.refetch()}
									>
										Retry
									</Button>
								</div>
							) : !billers.length ? (
								<p className="text-ink-muted text-[13px]">
									No billers in this category.
								</p>
							) : (
								<div className="space-y-2">
									{billers.map((item) => (
										<BillerCard
											key={item.id}
											biller={item}
											icon={category.icon}
											selected={billerId === item.id}
											onClick={() => {
												if (billerId === item.id) return;
												setBillerId(item.id);
												setAccountNumber("");
												setAmount("");
											}}
										/>
									))}
								</div>
							)}
						</section>
					) : null}
					{biller ? (
						<div className="space-y-5">
							<TextField
								label="Biller account number"
								value={accountNumber}
								inputMode="numeric"
								placeholder="4–20 digits"
								maxLength={20}
								onChange={(event) =>
									setAccountNumber(digitsOnly(event.target.value, 20))
								}
							/>
							<TextField
								label="Amount"
								value={amount}
								inputMode="decimal"
								placeholder="0.00"
								prefix="₱"
								hint={`Up to ${peso(MAX_TRANSACTION_CENTAVOS)}`}
								error={
									exceedsLimit
										? `Maximum ${peso(MAX_TRANSACTION_CENTAVOS)}`
										: null
								}
								onChange={(event) => {
									if (isPesoInput(event.target.value))
										setAmount(event.target.value);
								}}
							/>
						</div>
					) : null}
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
