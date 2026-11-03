"use client";

import { ArrowUpRight, Banknote, Gem } from "lucide-react";
import { useState } from "react";
import { cn } from "~/shared/lib/cn";
import { dateTime, peso } from "~/shared/lib/format";
import { MIN_REDEEM_POINTS, pointsValue } from "~/shared/lib/money";
import { Button } from "~/shared/ui/button";
import { FormError } from "~/shared/ui/money-form-ui";
import { PageHeader } from "~/shared/ui/page-header";
import { TextField } from "~/shared/ui/text-field";
import { TransactionReceipt } from "~/shared/ui/transaction-receipt";
import { TransactionSummary } from "~/shared/ui/transaction-summary";
import { errorMessage } from "~/trpc/error-message";
import { api, type RouterOutputs } from "~/trpc/react";
import {
	REDEEM_PRESETS,
	checkRedeem,
	pointsToNextPeso,
	redeemablePoints,
} from "../rewards.rules";
import { RewardHistory } from "./reward-history";

type Summary = RouterOutputs["rewards"]["summary"];

const formatPoints = (points: number) => points.toLocaleString("en-PH");

export function RewardsScreen() {
	const summary = api.rewards.summary.useQuery(undefined, {
		staleTime: 0,
		refetchOnMount: "always",
	});
	const redeem = api.rewards.redeem.useMutation();
	const [input, setInput] = useState("");
	const [reviewing, setReviewing] = useState(false);

	const reset = () => {
		redeem.reset();
		setInput("");
		setReviewing(false);
	};

	if (redeem.data) {
		return (
			<TransactionReceipt title="Cash back added" onDone={reset}>
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
				<div className="space-y-4 pt-6" role="status" aria-label="Loading">
					<div className="bg-surface-raised h-44 animate-pulse rounded-[24px]" />
					<div className="bg-surface-raised h-20 animate-pulse rounded-2xl" />
				</div>
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
				<div className="space-y-7 pt-6">
					<PointsCard points={summary.data.points} />
					<Stats summary={summary.data} />
					<section aria-labelledby="redeem-heading">
						<h2
							id="redeem-heading"
							className="text-ink mb-3 text-[15px] font-semibold"
						>
							Redeem points
						</h2>
						{reviewing ? (
							<RedeemReview
								input={input}
								points={summary.data.points}
								pending={redeem.isPending}
								error={redeem.error ? errorMessage(redeem.error) : null}
								onConfirm={(points) => redeem.mutate({ points })}
								onBack={() => {
									redeem.reset();
									setReviewing(false);
								}}
							/>
						) : (
							<RedeemForm
								input={input}
								points={summary.data.points}
								onChange={setInput}
								onReview={() => setReviewing(true)}
							/>
						)}
					</section>
					<HowItWorks />
					<section aria-labelledby="history-heading">
						<h2
							id="history-heading"
							className="text-ink mb-3 text-[15px] font-semibold"
						>
							History
						</h2>
						<RewardHistory />
					</section>
				</div>
			)}
		</div>
	);
}

function PointsCard({ points }: { points: number }) {
	const missing = pointsToNextPeso(points);
	const progress = Math.min(100, (points / MIN_REDEEM_POINTS) * 100);
	const ready = redeemablePoints(points);
	return (
		<section className="rounded-[24px] bg-[linear-gradient(140deg,#2b2518_0%,#211f1a_45%,#1d1d1f_100%)] p-6 ring-1 ring-[#e6c17a]/15 ring-inset">
			<div className="flex items-center justify-between gap-3">
				<p className="flex items-center gap-2 text-[13px] font-medium text-[#e6c17a]">
					<Gem size={15} aria-hidden />
					GoRewards
				</p>
				<p className="text-ink-muted text-[12px]">100 pts = ₱1.00</p>
			</div>
			<p className="text-ink mt-5 text-[40px] leading-none font-semibold tracking-tight tabular-nums">
				{formatPoints(points)}
			</p>
			<p className="text-ink-muted mt-2 text-[13px]">
				points available · worth {peso(pointsValue(points))}
			</p>
			<div
				className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/10"
				role="progressbar"
				aria-label="Progress to your next cash back"
				aria-valuemin={0}
				aria-valuemax={100}
				aria-valuenow={Math.round(progress)}
			>
				<span
					className="block h-full rounded-full bg-[#e6c17a] transition-[width] duration-500"
					style={{ width: `${progress}%` }}
				/>
			</div>
			<p className="text-ink-soft mt-2.5 text-[12.5px]">
				{missing
					? `${formatPoints(missing)} more points to unlock ₱1.00 cash back`
					: `${formatPoints(ready)} points ready to redeem for ${peso(pointsValue(ready))}`}
			</p>
		</section>
	);
}

function Stats({ summary }: { summary: Summary }) {
	const stats = [
		{ label: "Earned", value: `${formatPoints(summary.lifetimeEarned)} pts` },
		{
			label: "Redeemed",
			value: `${formatPoints(summary.lifetimeRedeemed)} pts`,
		},
		{ label: "Cash back", value: peso(summary.cashBackReceived) },
	];
	return (
		<dl className="grid grid-cols-3 gap-2">
			{stats.map(({ label, value }) => (
				<div
					key={label}
					className="border-line bg-surface-sunken min-w-0 rounded-2xl border px-3 py-3"
				>
					<dt className="text-ink-muted text-[11.5px]">{label}</dt>
					<dd className="text-ink mt-1 truncate text-[14px] font-semibold tabular-nums">
						{value}
					</dd>
				</div>
			))}
		</dl>
	);
}

function RedeemForm({
	input,
	points,
	onChange,
	onReview,
}: {
	input: string;
	points: number;
	onChange: (value: string) => void;
	onReview: () => void;
}) {
	const check = checkRedeem(input, points);
	const max = redeemablePoints(points);
	if (!max)
		return (
			<p className="border-line bg-surface-sunken text-ink-muted rounded-2xl border p-4 text-[13.5px] leading-relaxed">
				You can redeem once you have {MIN_REDEEM_POINTS} points. Send money or
				pay a bill to earn {formatPoints(pointsToNextPeso(points))} more.
			</p>
		);
	const presets = [...REDEEM_PRESETS.filter((value) => value < max), max].slice(
		-4,
	);
	return (
		<form
			className="border-line bg-surface-sunken space-y-4 rounded-2xl border p-4"
			onSubmit={(event) => {
				event.preventDefault();
				if (check.ok) onReview();
			}}
		>
			<TextField
				label="Points to redeem"
				inputMode="numeric"
				value={input}
				trailing={<span className="text-ink-muted text-[13px]">pts</span>}
				hint={
					check.ok
						? `You'll receive ${peso(check.cashBack)}`
						: `Multiples of ${MIN_REDEEM_POINTS}, up to ${formatPoints(max)}`
				}
				error={input && !check.ok ? check.error : null}
				onChange={(event) =>
					onChange(event.target.value.replace(/\D/g, "").slice(0, 10))
				}
			/>
			<div className="grid grid-cols-4 gap-2" aria-label="Quick amounts">
				{presets.map((value) => (
					<button
						key={value}
						type="button"
						aria-pressed={input === String(value)}
						onClick={() => onChange(String(value))}
						className={cn(
							"h-10 rounded-xl border text-[13px] font-medium tabular-nums transition-colors",
							input === String(value)
								? "border-brand bg-brand-soft text-brand"
								: "border-line text-ink-soft hover:bg-surface-raised",
						)}
					>
						{value === max ? "Max" : formatPoints(value)}
					</button>
				))}
			</div>
			<Button type="submit" disabled={!check.ok}>
				Review
			</Button>
		</form>
	);
}

function RedeemReview({
	input,
	points,
	pending,
	error,
	onConfirm,
	onBack,
}: {
	input: string;
	points: number;
	pending: boolean;
	error: string | null;
	onConfirm: (points: number) => void;
	onBack: () => void;
}) {
	const check = checkRedeem(input, points);
	if (!check.ok) return null;
	return (
		<div className="space-y-4">
			<TransactionSummary
				amount={check.cashBack}
				amountClassName="text-brand"
				details={[
					{ label: "Points used", value: formatPoints(check.points) },
					{
						label: "Points left",
						value: formatPoints(points - check.points),
					},
					{ label: "Credited to", value: "Main account" },
				]}
			/>
			<FormError error={error} />
			<div className="space-y-1.5">
				<Button disabled={pending} onClick={() => onConfirm(check.points)}>
					{pending ? "Redeeming…" : `Get ${peso(check.cashBack)} cash back`}
				</Button>
				<Button variant="ghost" disabled={pending} onClick={onBack}>
					Back
				</Button>
			</div>
		</div>
	);
}

function HowItWorks() {
	const steps = [
		{
			icon: ArrowUpRight,
			title: "Earn",
			text: "1 point for every ₱50 you send or spend on bill payments.",
		},
		{
			icon: Banknote,
			title: "Redeem",
			text: "Every 100 points becomes ₱1.00, added to your main account instantly.",
		},
	];
	return (
		<section aria-labelledby="how-heading">
			<h2 id="how-heading" className="text-ink mb-3 text-[15px] font-semibold">
				How it works
			</h2>
			<ol className="border-line divide-line divide-y rounded-2xl border">
				{steps.map(({ icon: Icon, title, text }) => (
					<li key={title} className="flex gap-3 p-4">
						<span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#e6c17a]/10 text-[#e6c17a]">
							<Icon size={17} aria-hidden />
						</span>
						<div>
							<p className="text-ink text-[14px] font-medium">{title}</p>
							<p className="text-ink-muted mt-0.5 text-[13px] leading-relaxed">
								{text}
							</p>
						</div>
					</li>
				))}
			</ol>
		</section>
	);
}
