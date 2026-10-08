"use client";

import { useState } from "react";
import { peso } from "~/shared/lib/format";
import { MIN_REDEEM_POINTS, pointsValue } from "~/shared/lib/money";
import { Button } from "~/shared/ui/button";
import { PageHeader } from "~/shared/ui/page-header";
import { TextField } from "~/shared/ui/text-field";
import { errorMessage } from "~/trpc/error-message";
import { api, type RouterOutputs } from "~/trpc/react";

export function RewardsScreen({
	initialOverview,
}: {
	initialOverview: RouterOutputs["account"]["overview"];
}) {
	const utils = api.useUtils();
	const overview = api.account.overview.useQuery(undefined, {
		initialData: initialOverview,
	});
	const [amount, setAmount] = useState("");
	const redeem = api.rewards.redeem.useMutation({
		onSuccess: () => {
			setAmount("");
			void utils.account.invalidate();
		},
	});
	const points = overview.data.points;
	const requestedPoints = Number(amount);
	const validAmount =
		Number.isInteger(requestedPoints) &&
		requestedPoints >= MIN_REDEEM_POINTS &&
		requestedPoints <= points;

	return (
		<form
			className="flex flex-1 flex-col gap-7"
			onSubmit={(event) => {
				event.preventDefault();
				if (validAmount && !redeem.isPending)
					redeem.mutate({ points: requestedPoints });
			}}
		>
			<PageHeader title="Rewards" back="/dashboard" />
			<section className="border-line bg-surface-sunken rounded-2xl border p-5">
				<p className="text-ink-muted text-[13px]">Available points</p>
				<p className="text-ink mt-2 text-[36px] font-semibold tabular-nums">
					{points.toLocaleString()}
				</p>
				<p className="text-brand mt-1 text-[14px]">
					{peso(pointsValue(points))} cashback
				</p>
			</section>
			<TextField
				label="Points to redeem"
				inputMode="numeric"
				value={amount}
				placeholder="100"
				disabled={redeem.isPending}
				hint="100 points = ₱1. Minimum 100 points."
				onChange={(event) => {
					if (/^\d{0,10}$/.test(event.target.value)) {
						setAmount(event.target.value);
						redeem.reset();
					}
				}}
			/>
			{validAmount ? (
				<p className="text-ink-soft text-[14px]">
					Cashback: {peso(pointsValue(requestedPoints))}
				</p>
			) : null}
			{redeem.error ? (
				<p role="alert" className="text-danger text-[13px]">
					{errorMessage(redeem.error)}
				</p>
			) : null}
			{redeem.data ? (
				<p role="status" className="text-brand text-[14px]">
					{peso(redeem.data.amount)} added to your main balance.
				</p>
			) : null}
			<div className="mt-auto pt-4">
				<Button type="submit" disabled={!validAmount || redeem.isPending}>
					{redeem.isPending ? "Redeeming…" : "Redeem"}
				</Button>
			</div>
		</form>
	);
}
