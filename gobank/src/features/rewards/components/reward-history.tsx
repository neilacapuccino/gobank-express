"use client";

import { Gem, Sparkles } from "lucide-react";
import Link from "next/link";
import { cn } from "~/shared/lib/cn";
import { dateTime, peso } from "~/shared/lib/format";
import { Button } from "~/shared/ui/button";
import { FormError } from "~/shared/ui/money-form-ui";
import { errorMessage } from "~/trpc/error-message";
import { api, type RouterOutputs } from "~/trpc/react";

type RewardItem = RouterOutputs["rewards"]["history"]["items"][number];

export function RewardHistory({ emptyText }: { emptyText: string }) {
	const history = api.rewards.history.useInfiniteQuery(
		{ limit: 20 },
		{
			getNextPageParam: (page) => page.next ?? undefined,
			staleTime: 0,
			refetchOnMount: "always",
		},
	);
	const items = history.data?.pages.flatMap((page) => page.items) ?? [];

	if (history.isLoading)
		return (
			<p role="status" className="text-ink-muted py-8 text-center text-[14px]">
				Loading rewards…
			</p>
		);

	return (
		<div>
			{!items.length && !history.error ? (
				<div className="border-line flex flex-col items-center gap-4 rounded-2xl border px-5 py-10">
					<Gem size={28} className="text-ink-muted" aria-hidden />
					<p className="text-ink-muted text-center text-[14px]">{emptyText}</p>
				</div>
			) : (
				<ul className="space-y-3">
					{items.map((item) => (
						<li key={item.id}>
							<RewardRow item={item} />
						</li>
					))}
				</ul>
			)}
			{history.error ? (
				<div className="mt-5">
					<FormError error={errorMessage(history.error)} />
					<Button
						variant="ghost"
						disabled={history.isFetching}
						onClick={() => {
							if (history.isFetchNextPageError) void history.fetchNextPage();
							else void history.refetch();
						}}
					>
						{history.isFetching ? "Retrying…" : "Retry"}
					</Button>
				</div>
			) : history.hasNextPage ? (
				<Button
					variant="outline"
					className="mt-5"
					disabled={history.isFetching}
					onClick={() => void history.fetchNextPage()}
				>
					{history.isFetchingNextPage ? "Loading…" : "Load more"}
				</Button>
			) : null}
		</div>
	);
}

function RewardRow({ item }: { item: RewardItem }) {
	const redeemed = item.points < 0;
	return (
		<Link
			href={`/transactions/${item.reference}`}
			className="border-line hover:bg-surface-raised flex items-center gap-3 rounded-2xl border p-4 transition-colors"
		>
			<span
				className={cn(
					"grid h-10 w-10 shrink-0 place-items-center rounded-full",
					redeemed ? "bg-brand-soft text-brand" : "bg-surface-raised",
				)}
			>
				<Sparkles size={18} aria-hidden />
			</span>
			<span className="min-w-0 flex-1">
				<span className="text-ink block truncate text-[14px] font-medium">
					{redeemed
						? item.title
						: `Earned from ${item.title} (${peso(Math.abs(item.amount))})`}
				</span>
				<span className="text-ink-muted block text-[12px]">
					{dateTime(item.createdAt)}
				</span>
			</span>
			<span
				className={cn(
					"shrink-0 text-[14px] font-semibold tabular-nums",
					redeemed ? "text-ink" : "text-brand",
				)}
			>
				{redeemed ? "" : "+"}
				{item.points.toLocaleString("en-PH")} pts
			</span>
		</Link>
	);
}
