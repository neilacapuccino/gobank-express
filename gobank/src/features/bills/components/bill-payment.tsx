"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { isPesoInput } from "~/shared/lib/amount-input";
import { dateTime, digitsOnly, maskDigits, peso } from "~/shared/lib/format";
import { MAX_TRANSACTION_CENTAVOS, toCentavos } from "~/shared/lib/money";
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
import type { LucideIcon } from "lucide-react";
import {
	CATEGORIES,
	findCategory,
	type Biller,
	type Category,
} from "../bill-categories";
import { BillerCard } from "./biller-card";
import { CategoryCard } from "./category-card";

const ACCOUNT_NUMBER = /^\d{4,20}$/;
const ACCOUNT_NUMBER_MAX = 20;

function BillerList({
	billers,
	loading,
	error,
	selectedId,
	icon,
	onRetry,
	onSelect,
}: {
	billers: Biller[];
	loading: boolean;
	error: string | null;
	selectedId: string | null;
	icon: LucideIcon;
	onRetry: () => void;
	onSelect: (id: string) => void;
}) {
	if (loading) {
		return (
			<p role="status" className="text-ink-muted text-[13px]">
				Loading billers…
			</p>
		);
	}

	if (error) {
		return (
			<div>
				<FormError error={error} />
				<Button type="button" variant="ghost" onClick={onRetry}>
					Retry
				</Button>
			</div>
		);
	}

	if (billers.length === 0) {
		return (
			<p className="text-ink-muted text-[13px]">No billers in this category.</p>
		);
	}

	return (
		<div className="space-y-2">
			{billers.map((biller) => (
				<BillerCard
					key={biller.id}
					biller={biller}
					icon={icon}
					selected={selectedId === biller.id}
					onClick={() => onSelect(biller.id)}
				/>
			))}
		</div>
	);
}

export function BillPayment() {
	const router = useRouter();
	const [categoryId, setCategoryId] = useState<Category | null>(null);
	const [billerId, setBillerId] = useState<string | null>(null);
	const [accountNumber, setAccountNumber] = useState("");
	const [amount, setAmount] = useState("");
	const [reviewing, setReviewing] = useState(false);

	const catalogue = api.bills.billers.useQuery();
	const pay = api.bills.pay.useMutation();
	const limit = useSpendLimit(MAX_TRANSACTION_CENTAVOS);

	const category = findCategory(categoryId);
	const billers =
		catalogue.data?.filter((item) => item.category === categoryId) ?? [];
	const biller = billers.find((item) => item.id === billerId);

	const amountCentavos = toCentavos(Number(amount));
	const validDetails =
		Boolean(biller) &&
		ACCOUNT_NUMBER.test(accountNumber) &&
		limit.valid(amountCentavos);

	const clearPaymentDetails = () => {
		setAccountNumber("");
		setAmount("");
	};

	const chooseCategory = (id: Category) => {
		if (categoryId === id) return;

		setCategoryId(id);
		setBillerId(null);
		clearPaymentDetails();
	};

	const chooseBiller = (id: string) => {
		if (billerId === id) return;

		setBillerId(id);
		clearPaymentDetails();
	};

	const leaveReview = () => {
		pay.reset();
		setReviewing(false);
	};

	const payBill = () => {
		if (!biller || !validDetails || pay.isPending) return;

		pay.mutate({
			billerId: biller.id,
			accountNumber,
			amount: amountCentavos,
			card: limit.card,
		});
	};

	const finish = () => {
		router.push("/dashboard");
		router.refresh();
	};

	if (pay.data) {
		return (
			<TransactionReceipt title="Payment successful" onDone={finish}>
				<TransactionSummary
					amount={Math.abs(pay.data.amount)}
					details={[
						{ label: "Account", value: maskDigits(accountNumber) },
						{ label: "Reference", value: pay.data.reference },
						{ label: "Date", value: dateTime(pay.data.createdAt) },
						{ label: "Points earned", value: `+${pay.data.points}` },
						{ label: "Balance", value: peso(pay.data.balanceAfter) },
						...paidWithDetail(pay.data.details),
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
						onClick={leaveReview}
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

			{limit.locked && !pay.isPending ? <CardLockedNotice /> : null}

			{reviewing && biller ? (
				<div className="flex flex-1 flex-col pt-7">
					<TransactionSummary
						amount={amountCentavos}
						details={[{ label: "Account", value: accountNumber }]}
					>
						<p className="text-ink text-[14px] font-medium">{biller.name}</p>
					</TransactionSummary>

					<CardPicker
						cards={limit.cards}
						value={limit.card}
						onChange={limit.setCard}
						disabled={pay.isPending}
					/>

					<FormError error={errorMessage(pay.error)} />

					<div className="mt-auto pt-8">
						<Button disabled={pay.isPending} onClick={payBill}>
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
									onClick={() => chooseCategory(item.id)}
								/>
							))}
						</div>
					</section>

					{category ? (
						<section>
							<h2 className="text-ink mb-3 text-[14px] font-medium">Biller</h2>
							<BillerList
								billers={billers}
								loading={catalogue.isLoading}
								error={errorMessage(catalogue.error)}
								selectedId={billerId}
								icon={category.icon}
								onRetry={() => void catalogue.refetch()}
								onSelect={chooseBiller}
							/>
						</section>
					) : null}

					{biller ? (
						<div className="space-y-5">
							<TextField
								label="Biller account number"
								value={accountNumber}
								inputMode="numeric"
								maxLength={ACCOUNT_NUMBER_MAX}
								hint="4 to 20 digits, as printed on your bill."
								onChange={(event) =>
									setAccountNumber(
										digitsOnly(event.target.value, ACCOUNT_NUMBER_MAX),
									)
								}
							/>
							<TextField
								label="Amount"
								value={amount}
								inputMode="decimal"
								prefix="₱"
								hint={limit.hint}
								error={limit.check(amountCentavos)}
								onChange={(event) => {
									if (isPesoInput(event.target.value)) {
										setAmount(event.target.value);
									}
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
