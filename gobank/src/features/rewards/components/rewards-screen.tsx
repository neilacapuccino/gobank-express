"use client";

import { Gem } from "lucide-react";
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
import { api } from "~/trpc/react";
import {
	EARN_RULE,
	REDEEM_PRESETS,
	REDEEM_RULE,
	checkRedeem,
	pointsToNextPeso,
	redeemablePoints,
} from "../rewards.rules";
import { RewardHistory } from "./reward-history";

export function RewardsScreen() {
	const utils = api.useUtils();
	const summary = api.rewards.summary.useQuery(undefined, {
		staleTime: 0,
		refetchOnMount: "always",
	});
	const [input, setInput] = useState("");
	const [reviewing, setReviewing] = useState(false);
	const redeem = api.rewards.redeem.useMutation({
		onSuccess: () =>
			Promise.all([utils.rewards.invalidate(), utils.account.invalidate()]),
	});

	if (redeem.data) {
		return (
			<TransactionReceipt
				title="Points redeemed"
				onDone={() => {
					redeem.reset();
					setInput("");
					setReviewing(false);
				}}
			>
				<TransactionSummary
					amount={Math.abs(redeem.data.amount)}
					details={[
						{
							label: "Points used",
							value: Math.abs(redeem.data.points).toLocaleString("en-PH"),
						},
						{ label: "Reference", value: redeem.data.reference },
						{ label: "Date", value: dateTime(redeem.data.createdAt) },
						{ label: "Balance", value: peso(redeem.data.balanceAfter) },
					]}
				/>
			</TransactionReceipt>
		);
	}

	if (summary.isLoading)
		return (
			<div className="flex flex-1 flex-col">
				<PageHeader title="Rewards" back="/dashboard" />
				<p
					role="status"
					className="text-ink-muted py-8 text-center text-[14px]"
				>
					Loading rewards…
				</p>
			</div>
		);

	if (!summary.data)
		return (
			<div className="flex flex-1 flex-col">
				<PageHeader title="Rewards" back="/dashboard" />
				<div className="pt-7">
					<FormError
						error={summary.error ? errorMessage(summary.error) : null}
					/>
					<Button variant="outline" onClick={() => void summary.refetch()}>
						Retry
					</Button>
				</div>
			</div>
		);

	const { points, lifetimeEarned, lifetimeRedeemed, cashBackReceived } =
		summary.data;
	const check = checkRedeem(input, points);
	const inputError = input && !check.ok ? check.error : null;
	const missing = pointsToNextPeso(points);
	const maxRedeem = redeemablePoints(points);

	return (
		<div className="flex flex-1 flex-col">
			<PageHeader title="Rewards" back="/dashboard" />
			<div className="space-y-8 pt-7">
				<section className="bg-surface-raised rounded-[28px] px-6 py-6">
					<p className="text-ink-muted flex items-center gap-2 text-[13px]">
						<Gem size={15} className="text-[#e6c17a]" aria-hidden />
						Your points
					</p>
					<p className="text-ink mt-2 text-[2.35rem] leading-tight font-semibold tracking-tight tabular-nums">
						{points.toLocaleString("en-PH")}
					</p>
					<p className="text-ink-soft mt-1 text-[14px]">
						Worth {peso(pointsValue(points))} cash back
					</p>
					<p className="text-ink-muted border-line mt-5 border-t pt-4 text-[12px]">
						{missing
							? `Earn ${missing} more points to redeem your first ₱1.00.`
							: `You can redeem up to ${maxRedeem.toLocaleString("en-PH")} points (${peso(pointsValue(maxRedeem))}).`}
					</p>
				</section>

				<section>
					<h2 className="text-ink mb-4 text-[15px] font-semibold">
						Redeem points
					</h2>
					{reviewing && check.ok ? (
						<div>
							<TransactionSummary
								amount={check.cashBack}
								details={[
									{
										label: "Points used",
										value: check.points.toLocaleString("en-PH"),
									},
									{ label: "Credited to", value: "Main account" },
								]}
							/>
							<FormError
								error={redeem.error ? errorMessage(redeem.error) : null}
							/>
							<div className="mt-6 space-y-2">
								<Button
									disabled={redeem.isPending}
									onClick={() => {
										if (!redeem.isPending)
											redeem.mutate({ points: check.points });
									}}
								>
									{redeem.isPending
										? "Redeeming…"
										: `Get ${peso(check.cashBack)} cash back`}
								</Button>
								<Button
									variant="ghost"
									disabled={redeem.isPending}
									onClick={() => {
										redeem.reset();
										setReviewing(false);
									}}
								>
									Back
								</Button>
							</div>
						</div>
					) : (
						<form
							className="flex flex-col gap-4"
							onSubmit={(event) => {
								event.preventDefault();
								if (check.ok) setReviewing(true);
							}}
						>
							<TextField
								label="Points to redeem"
								inputMode="numeric"
								value={input}
								hint={
									check.ok
										? `You'll get ${peso(check.cashBack)}`
										: `${REDEEM_RULE} · min ${MIN_REDEEM_POINTS}`
								}
								error={inputError}
								onChange={(event) =>
									setInput(event.target.value.replace(/\D/g, "").slice(0, 10))
								}
							/>
							<div
								className="grid grid-cols-4 gap-2"
								aria-label="Redeem amounts"
							>
								{REDEEM_PRESETS.map((value) => (
									<button
										key={value}
										type="button"
										disabled={value > points}
										aria-pressed={input === String(value)}
										onClick={() => setInput(String(value))}
										className={cn(
											"h-12 rounded-xl border px-2 text-[13px] font-medium transition-colors disabled:opacity-40",
											input === String(value)
												? "border-brand bg-brand-soft text-brand"
												: "border-line bg-surface-sunken text-ink enabled:hover:bg-surface-raised",
										)}
									>
										{value.toLocaleString("en-PH")}
									</button>
								))}
							</div>
							<div className="flex gap-2">
								<Button
									type="button"
									variant="outline"
									disabled={!maxRedeem}
									onClick={() => setInput(String(maxRedeem))}
								>
									Redeem all
								</Button>
								<Button type="submit" disabled={!check.ok}>
									Review
								</Button>
							</div>
						</form>
					)}
				</section>

				<section>
					<h2 className="text-ink mb-4 text-[15px] font-semibold">
						How it works
					</h2>
					<ul className="text-ink-soft border-line space-y-2 rounded-2xl border p-4 text-[13.5px]">
						<li>{EARN_RULE} on transfers and bill payments.</li>
						<li>{REDEEM_RULE}, credited instantly to your main account.</li>
						<li>
							Lifetime: {lifetimeEarned.toLocaleString("en-PH")} earned,{" "}
							{lifetimeRedeemed.toLocaleString("en-PH")} redeemed (
							{peso(cashBackReceived)} cash back).
						</li>
					</ul>
				</section>

				<section>
					<h2 className="text-ink mb-4 text-[15px] font-semibold">History</h2>
					<RewardHistory emptyText="No points yet. Send money or pay a bill to start earning." />
				</section>
			</div>
		</div>
	);
}
