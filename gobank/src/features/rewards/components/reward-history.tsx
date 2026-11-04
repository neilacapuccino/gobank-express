"use client";

import { ArrowUpRight, Banknote, Gem, ReceiptText } from "lucide-react";
import Link from "next/link";
import { cn } from "~/shared/lib/cn";
import { peso, shortDate } from "~/shared/lib/format";
import { Button } from "~/shared/ui/button";
import { FormError } from "~/shared/ui/money-form-ui";
import { errorMessage } from "~/trpc/error-message";
import { api, type RouterOutputs } from "~/trpc/react";

type RewardItem = RouterOutputs["rewards"]["history"]["items"][number];

export function RewardHistory() {
	const history = api.rewards.history.useInfiniteQuery(
		{ limit: 20 },
		{
			getNextPageParam: (page) => page.next ?? undefined,
			staleTime: 0,
			refetchOnMount: "always",
		},
	);
	const items = history.data?.pages.flatMap((page) => page.items) ?? [];
	const isEmpty = items.length === 0 && !history.error;

	const retry = () => {
		if (history.isFetchNextPageError) void history.fetchNextPage();
		else void history.refetch();
	};

	if (history.isLoading) {
		return (
			<p role="status" className="text-ink-soft py-8 text-center text-[14px]">
				Loading history…
			</p>
		);
	}

	return (
		<div>
			{isEmpty ? (
				<div className="border-line flex flex-col items-center gap-3 rounded-2xl border px-5 py-9 text-center">
					<Gem size={24} className="text-mint" aria-hidden />
					<p className="text-ink-soft text-[14px]">
						No points yet. Send money or pay a bill to start earning.
					</p>
				</div>
			) : (
				<ul className="border-line divide-line divide-y rounded-2xl border">
					{items.map((item) => (
						<li key={item.id}>
							<RewardRow item={item} />
						</li>
					))}
				</ul>
			)}

			{history.error ? (
				<div className="mt-4">
					<FormError error={errorMessage(history.error)} />
					<Button variant="ghost" disabled={history.isFetching} onClick={retry}>
						{history.isFetching ? "Retrying…" : "Retry"}
					</Button>
				</div>
			) : null}

			{!history.error && history.hasNextPage ? (
				<Button
					variant="outline"
					className="mt-4"
					disabled={history.isFetching}
					onClick={() => void history.fetchNextPage()}
				>
					{history.isFetchingNextPage ? "Loading…" : "Load more"}
				</Button>
			) : null}
		</div>
	);
}

function rewardIcon(item: RewardItem) {
	if (item.points < 0) return Banknote;
	return item.kind === "bill" ? ReceiptText : ArrowUpRight;
}

function RewardRow({ item }: { item: RewardItem }) {
	const redeemed = item.points < 0;
	const Icon = rewardIcon(item);
	const spent = redeemed ? "" : ` · ${peso(Math.abs(item.amount))} spent`;

	return (
		<Link
			href={`/transactions/${item.reference}`}
			className="hover:bg-surface-raised flex items-center gap-3 px-4 py-3.5 transition-colors first:rounded-t-2xl last:rounded-b-2xl"
		>
			<span
				className={cn(
					"grid h-9 w-9 shrink-0 place-items-center rounded-full",
					redeemed
						? "bg-surface-raised text-ink-soft"
						: "bg-brand-soft text-mint",
				)}
			>
				<Icon size={16} aria-hidden />
			</span>
			<span className="min-w-0 flex-1">
				<span className="text-ink block truncate text-[14px] font-medium">
					{redeemed ? "Cash back" : item.title}
				</span>
				<span className="text-ink-soft block truncate text-[13px]">
					{shortDate(item.createdAt)}
					{spent}
				</span>
			</span>
			<span className="shrink-0 text-right">
				<span
					className={cn(
						"block text-[14px] font-semibold tabular-nums",
						redeemed ? "text-ink-soft" : "text-mint",
					)}
				>
					{redeemed ? "−" : "+"}
					{Math.abs(item.points).toLocaleString("en-PH")} pts
				</span>
				{redeemed ? (
					<span className="text-mint block text-[13px] tabular-nums">
						+{peso(item.amount)}
					</span>
				) : null}
			</span>
		</Link>
	);
}
