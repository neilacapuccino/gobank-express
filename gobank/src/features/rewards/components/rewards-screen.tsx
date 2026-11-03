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
	convertOptions,
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

	const stopConverting = () => {
		redeem.reset();
		setConverting(false);
	};

	return (
		<div className="flex flex-1 flex-col">
			<PageHeader title="Rewards" back="/dashboard" />

			{summary.isPending ? (
				<div
					role="status"
					aria-label="Loading"
					className="bg-surface-raised mt-6 h-56 animate-pulse rounded-[24px]"
				/>
			) : null}

			{summary.error ? (
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
			) : null}

			{summary.data ? (
				<div className="space-y-8 pt-6">
					<PointsCard points={summary.data.points}>
						{converting ? (
							<ConvertPanel
								points={summary.data.points}
								pending={redeem.isPending}
								error={errorMessage(redeem.error)}
								onConfirm={(points) => redeem.mutate({ points })}
								onCancel={stopConverting}
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
					</PointsCard>

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
			) : null}
		</div>
	);
}

function PointsCard({
	points,
	children,
}: {
	points: number;
	children: ReactNode;
}) {
	const rate = `${formatPoints(MIN_REDEEM_POINTS)} pts = ${peso(pointsValue(MIN_REDEEM_POINTS))}`;

	return (
		<section className="bg-surface-raised text-ink rounded-[28px] px-6 py-6 shadow-[0_10px_26px_-12px_#00000080]">
			<div className="flex items-center justify-between">
				<p className="text-ink-muted text-[13px]">GoRewards points</p>
				<Gem size={16} className="text-ink-muted" aria-hidden />
			</div>

			<p className="mt-2 text-[40px] leading-none font-semibold tracking-tight tabular-nums">
				{formatPoints(points)}
				<span className="text-ink-muted ml-2 text-[15px] font-medium">pts</span>
			</p>

			<dl className="border-line mt-6 grid grid-cols-2 gap-4 border-t pt-4">
				<SummaryItem label="Cash value" value={peso(pointsValue(points))} />
				<SummaryItem label="Conversion rate" value={rate} />
			</dl>

			{children}
		</section>
	);
}

function SummaryItem({ label, value }: { label: string; value: string }) {
	return (
		<div className="min-w-0">
			<dt className="text-ink-muted text-[12px]">{label}</dt>
			<dd className="text-ink mt-1 truncate text-[14px] font-medium tabular-nums">
				{value}
			</dd>
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

	if (!missing) return children;

	return (
		<>
			<div
				className="bg-line mt-6 h-1.5 overflow-hidden rounded-full"
				role="progressbar"
				aria-label={`Points toward ${peso(pointsValue(MIN_REDEEM_POINTS))}`}
				aria-valuemin={0}
				aria-valuemax={100}
				aria-valuenow={Math.round(progress)}
			>
				<span
					className="bg-ink-soft block h-full rounded-full"
					style={{ width: `${progress}%` }}
				/>
			</div>

			<p className="text-ink-muted mt-2 text-[12.5px]">
				{formatPoints(missing)} pts more to convert to cash
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
	const options = convertOptions(points);
	const [selected, setSelected] = useState(max);

	return (
		<div className="border-line mt-6 border-t pt-5">
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
								? "border-ink text-ink bg-white/5"
								: "text-ink-soft border-line hover:bg-white/5",
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
