"use client";

import { Gem } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "~/shared/lib/cn";
import { dateTime, peso } from "~/shared/lib/format";
import { MIN_REDEEM_POINTS, pointsValue } from "~/shared/lib/money";
import { Button } from "~/shared/ui/button";
import { FormError } from "~/shared/ui/money-form-ui";
import { PageHeader } from "~/shared/ui/page-header";
import { TransactionReceipt } from "~/shared/ui/transaction-receipt";
import { TransactionSummary } from "~/shared/ui/transaction-summary";
import { errorMessage } from "~/trpc/error-message";
import { api } from "~/trpc/react";
import {
	REDEEM_PRESETS,
	pointsToNextPeso,
	redeemablePoints,
} from "../rewards.rules";
import { RewardHistory } from "./reward-history";

const formatPoints = (points: number) => points.toLocaleString("en-PH");

export function RewardsScreen() {
	const summary = api.rewards.summary.useQuery(undefined, {
		staleTime: 0,
		refetchOnMount: "always",
	});
	const redeem = api.rewards.redeem.useMutation();
	const [converting, setConverting] = useState(false);

	if (redeem.data) {
		return (
			<TransactionReceipt
				title="Cash back credited"
				onDone={() => {
					redeem.reset();
					setConverting(false);
				}}
			>
				<TransactionSummary
					amount={Math.abs(redeem.data.amount)}
					amountClassName="text-brand"
					details={[
						{
							label: "Points used",
							value: formatPoints(Math.abs(redeem.data.points)),
						},
						{ label: "Reference", value: redeem.data.reference },
						{ label: "Date", value: dateTime(redeem.data.createdAt) },
						{ label: "Main balance", value: peso(redeem.data.balanceAfter) },
					]}
				/>
			</TransactionReceipt>
		);
	}

	return (
		<div className="flex flex-1 flex-col">
			<PageHeader title="Rewards" back="/dashboard" />
			{summary.isPending ? (
				<div
					role="status"
					aria-label="Loading"
					className="bg-surface-raised mt-6 h-56 animate-pulse rounded-[24px]"
				/>
			) : summary.error ? (
				<div className="pt-7">
					<FormError error={errorMessage(summary.error)} />
					<Button
						variant="outline"
						className="mt-4"
						onClick={() => void summary.refetch()}
					>
						Try again
					</Button>
				</div>
			) : (
				<div className="space-y-8 pt-6">
					<section className="rounded-[24px] bg-[linear-gradient(140deg,#2b2518_0%,#211f1a_45%,#1d1d1f_100%)] p-6 ring-1 ring-[#e6c17a]/15 ring-inset">
						<p className="flex items-center gap-2 text-[13px] font-medium text-[#e6c17a]">
							<Gem size={15} aria-hidden />
							GoRewards
						</p>
						<p className="text-ink mt-4 text-[40px] leading-none font-semibold tracking-tight tabular-nums">
							{formatPoints(summary.data.points)}
							<span className="text-ink-muted ml-2 text-[15px] font-medium">
								pts
							</span>
						</p>
						<p className="text-ink-soft mt-2 text-[14px]">
							Worth {peso(pointsValue(summary.data.points))}
						</p>
						{converting ? (
							<ConvertPanel
								points={summary.data.points}
								pending={redeem.isPending}
								error={redeem.error ? errorMessage(redeem.error) : null}
								onConfirm={(points) => redeem.mutate({ points })}
								onCancel={() => {
									redeem.reset();
									setConverting(false);
								}}
							/>
						) : (
							<Progress points={summary.data.points}>
								<Button
									className="mt-5"
									disabled={summary.data.points < MIN_REDEEM_POINTS}
									onClick={() => setConverting(true)}
								>
									Convert to cash
								</Button>
							</Progress>
						)}
					</section>
					<section aria-labelledby="history-heading">
						<div className="mb-3 flex items-baseline justify-between">
							<h2
								id="history-heading"
								className="text-ink text-[15px] font-semibold"
							>
								History
							</h2>
							<p className="text-ink-muted text-[12px]">1 pt per ₱50 spent</p>
						</div>
						<RewardHistory />
					</section>
				</div>
			)}
		</div>
	);
}

function Progress({
	points,
	children,
}: {
	points: number;
	children: ReactNode;
}) {
	const missing = pointsToNextPeso(points);
	const progress = Math.min(100, (points / MIN_REDEEM_POINTS) * 100);
	return (
		<>
			<div
				className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/10"
				role="progressbar"
				aria-label="Points toward ₱1.00"
				aria-valuemin={0}
				aria-valuemax={100}
				aria-valuenow={Math.round(progress)}
			>
				<span
					className="block h-full rounded-full bg-[#e6c17a]"
					style={{ width: `${progress}%` }}
				/>
			</div>
			<p className="text-ink-muted mt-2 text-[12.5px]">
				{missing
					? `${formatPoints(missing)} pts to your first ₱1.00`
					: "100 pts = ₱1.00"}
			</p>
			{children}
		</>
	);
}

function ConvertPanel({
	points,
	pending,
	error,
	onConfirm,
	onCancel,
}: {
	points: number;
	pending: boolean;
	error: string | null;
	onConfirm: (points: number) => void;
	onCancel: () => void;
}) {
	const max = redeemablePoints(points);
	const options = [...REDEEM_PRESETS.filter((value) => value < max), max].slice(
		-4,
	);
	const [selected, setSelected] = useState(max);
	return (
		<div className="mt-6 border-t border-white/10 pt-5">
			<p className="text-ink-soft mb-3 text-[13px]">Points to convert</p>
			<div className="grid grid-cols-4 gap-2" role="radiogroup">
				{options.map((value) => (
					<button
						key={value}
						type="button"
						role="radio"
						aria-checked={selected === value}
						disabled={pending}
						onClick={() => setSelected(value)}
						className={cn(
							"h-11 rounded-xl border text-[13px] font-medium tabular-nums transition-colors",
							selected === value
								? "border-[#e6c17a] bg-[#e6c17a]/10 text-[#e6c17a]"
								: "text-ink-soft border-white/10 hover:bg-white/5",
						)}
					>
						{value === max && options.length > 1 ? "All" : formatPoints(value)}
					</button>
				))}
			</div>
			<FormError error={error} />
			<Button
				className="mt-4"
				disabled={pending}
				onClick={() => onConfirm(selected)}
			>
				{pending
					? "Converting…"
					: `Get ${peso(pointsValue(selected))} for ${formatPoints(selected)} pts`}
			</Button>
			<Button variant="ghost" disabled={pending} onClick={onCancel}>
				Cancel
			</Button>
		</div>
	);
}
