"use client";

import { ReceiptText } from "lucide-react";
import { useState } from "react";
import { cn } from "~/shared/lib/cn";
import { dateTime } from "~/shared/lib/format";
import { Button } from "~/shared/ui/button";
import { FormError } from "~/shared/ui/money-form-ui";
import { PageHeader } from "~/shared/ui/page-header";
import { errorMessage } from "~/trpc/error-message";
import { api } from "~/trpc/react";
import type { ActivityEntry } from "../activity.fields";
import {
	ACTIVITY_FILTERS,
	FILTER_LABELS,
	groupByDay,
	type ActivityFilter,
} from "../activity.rules";
import { ActivityRow } from "./activity-row";

function pointsNote(points: number) {
	if (!points) return "";

	const sign = points > 0 ? "+" : "";
	return ` · ${sign}${points.toLocaleString("en-PH")} pts`;
}

const entryDetail = (entry: ActivityEntry) =>
	`${dateTime(entry.createdAt)}${pointsNote(entry.points)}`;

function FilterSwitch({
	selected,
	onSelect,
}: {
	selected: ActivityFilter;
	onSelect: (filter: ActivityFilter) => void;
}) {
	return (
		<div
			className="border-line bg-surface-sunken mb-5 grid grid-cols-3 gap-1 rounded-2xl border p-1"
			aria-label="Activity filter"
		>
			{ACTIVITY_FILTERS.map((filter) => (
				<button
					key={filter}
					type="button"
					aria-pressed={selected === filter}
					onClick={() => onSelect(filter)}
					className={cn(
						"h-11 rounded-xl text-[13px] font-medium transition-colors",
						selected === filter
							? "bg-surface-raised text-ink"
							: "text-ink-muted hover:text-ink",
					)}
				>
					{FILTER_LABELS[filter]}
				</button>
			))}
		</div>
	);
}

function NoActivity({ filter }: { filter: ActivityFilter }) {
	const message =
		filter === "all"
			? "No activity yet"
			: `No ${FILTER_LABELS[filter].toLowerCase()} yet`;

	return (
		<div className="border-line flex flex-col items-center gap-4 rounded-2xl border px-5 py-10">
			<ReceiptText size={28} className="text-ink-muted" aria-hidden />
			<p className="text-ink-muted text-center text-[14px]">{message}</p>
		</div>
	);
}

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
	const isEmpty = !activity.isLoading && !activity.error && items.length === 0;

	const retry = () => {
		if (activity.isFetchNextPageError) void activity.fetchNextPage();
		else void activity.refetch();
	};

	return (
		<div className="flex flex-1 flex-col">
			<PageHeader title="Transactions" back="/dashboard" />

			<div className="pt-7">
				<FilterSwitch selected={filter} onSelect={setFilter} />

				{activity.isLoading ? (
					<p
						role="status"
						className="text-ink-muted py-8 text-center text-[14px]"
					>
						Loading activity…
					</p>
				) : null}

				{isEmpty ? <NoActivity filter={filter} /> : null}

				{items.length > 0 ? (
					<div className="space-y-6">
						{groups.map((group) => (
							<section key={group.key}>
								<h2 className="text-ink-muted mb-3 text-[12px] font-medium">
									{group.label}
								</h2>
								<ul className="space-y-4">
									{group.items.map((entry) => (
										<li key={entry.id}>
											<ActivityRow entry={entry} detail={entryDetail(entry)} />
										</li>
									))}
								</ul>
							</section>
						))}
					</div>
				) : null}

				{activity.error ? (
					<div className="mt-5">
						<FormError error={errorMessage(activity.error)} />
						<Button
							variant="ghost"
							disabled={activity.isFetching}
							onClick={retry}
						>
							{activity.isFetching ? "Retrying…" : "Retry"}
						</Button>
					</div>
				) : null}

				{!activity.error && activity.hasNextPage ? (
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
