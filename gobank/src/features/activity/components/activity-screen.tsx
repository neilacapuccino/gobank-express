"use client";

import { ReceiptText } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "~/shared/lib/cn";
import { dateTime, peso } from "~/shared/lib/format";
import { Button } from "~/shared/ui/button";
import { FormError } from "~/shared/ui/money-form-ui";
import { PageHeader } from "~/shared/ui/page-header";
import { errorMessage } from "~/trpc/error-message";
import { api, type RouterOutputs } from "~/trpc/react";
import {
	ACTIVITY_FILTERS,
	FILTER_LABELS,
	groupByDay,
	type ActivityFilter,
} from "../activity.rules";
import { activityIcon } from "./activity-icon";

type Entry = RouterOutputs["activity"]["list"]["items"][number];

export function ActivityScreen() {
	const [filter, setFilter] = useState<ActivityFilter>("all");
	const activity = api.activity.list.useInfiniteQuery(
		{ filter, limit: 20 },
		{
			getNextPageParam: (page) => page.next ?? undefined,
			staleTime: 0,
			refetchOnMount: "always",
		},
	);
	const items = activity.data?.pages.flatMap((page) => page.items) ?? [];
	const groups = groupByDay(items);

	return (
		<div className="flex flex-1 flex-col">
			<PageHeader title="Activity" back="/dashboard" />
			<div className="pt-7">
				<div
					className="border-line bg-surface-sunken mb-5 grid grid-cols-3 gap-1 rounded-2xl border p-1"
					aria-label="Activity filter"
				>
					{ACTIVITY_FILTERS.map((value) => (
						<button
							key={value}
							type="button"
							aria-pressed={filter === value}
							onClick={() => setFilter(value)}
							className={cn(
								"h-11 rounded-xl text-[13px] font-medium transition-colors",
								filter === value
									? "bg-surface-raised text-ink"
									: "text-ink-muted hover:text-ink",
							)}
						>
							{FILTER_LABELS[value]}
						</button>
					))}
				</div>

				{activity.isLoading ? (
					<p
						role="status"
						className="text-ink-muted py-8 text-center text-[14px]"
					>
						Loading activity…
					</p>
				) : !items.length && !activity.error ? (
					<div className="border-line flex flex-col items-center gap-4 rounded-2xl border px-5 py-10">
						<ReceiptText size={28} className="text-ink-muted" aria-hidden />
						<p className="text-ink-muted text-center text-[14px]">
							{filter === "all"
								? "No activity yet"
								: `No ${FILTER_LABELS[filter].toLowerCase()} yet`}
						</p>
					</div>
				) : (
					<div className="space-y-6">
						{groups.map((group) => (
							<section key={group.key}>
								<h2 className="text-ink-muted mb-3 text-[12px] font-medium">
									{group.label}
								</h2>
								<ul className="space-y-4">
									{group.items.map((entry) => (
										<li key={entry.id}>
											<ActivityRow entry={entry} />
										</li>
									))}
								</ul>
							</section>
						))}
					</div>
				)}

				{activity.error ? (
					<div className="mt-5">
						<FormError error={errorMessage(activity.error)} />
						<Button
							variant="ghost"
							disabled={activity.isFetching}
							onClick={() => {
								if (activity.isFetchNextPageError)
									void activity.fetchNextPage();
								else void activity.refetch();
							}}
						>
							{activity.isFetching ? "Retrying…" : "Retry"}
						</Button>
					</div>
				) : activity.hasNextPage ? (
					<Button
						variant="outline"
						className="mt-5"
						disabled={activity.isFetching}
						onClick={() => void activity.fetchNextPage()}
					>
						{activity.isFetchingNextPage ? "Loading…" : "Load more"}
					</Button>
				) : null}
			</div>
		</div>
	);
}

function ActivityRow({ entry }: { entry: Entry }) {
	const incoming = entry.amount > 0;
	const Icon = activityIcon(entry);
	return (
		<Link
			href={`/transactions/${entry.reference}`}
			className="group flex items-center gap-3.5"
		>
			<span className="bg-surface-sunken text-ink-soft grid h-10 w-10 shrink-0 place-items-center rounded-full">
				<Icon size={16} strokeWidth={1.9} aria-hidden />
			</span>
			<span className="min-w-0 flex-1">
				<span className="text-ink group-hover:text-brand block truncate text-[14px] font-medium transition-colors">
					{entry.title}
				</span>
				<span className="text-ink-muted block text-[12px]">
					{dateTime(entry.createdAt)}
					{entry.points
						? ` · ${entry.points > 0 ? "+" : ""}${entry.points.toLocaleString("en-PH")} pts`
						: ""}
				</span>
			</span>
			<span
				className={cn(
					"shrink-0 text-[14px] font-semibold tabular-nums",
					incoming ? "text-brand" : "text-danger",
				)}
			>
				{incoming ? "+" : "−"}
				{peso(Math.abs(entry.amount))}
			</span>
		</Link>
	);
}
