"use client";

import { Button } from "~/shared/ui/button";
import { PageHeader } from "~/shared/ui/page-header";
import { api, type RouterOutputs } from "~/trpc/react";
import { errorMessage } from "~/trpc/error-message";
import { RecentActivity } from "./recent-activity";

export function ActivityScreen({
	initialPage,
}: {
	initialPage: RouterOutputs["account"]["activity"];
}) {
	const activity = api.account.activity.useInfiniteQuery(
		{ limit: 20 },
		{
			initialData: { pages: [initialPage], pageParams: [undefined] },
			getNextPageParam: (page) => page.next ?? undefined,
		},
	);
	return (
		<div className="flex flex-col gap-7">
			<PageHeader title="Activity" back="/dashboard" />
			<RecentActivity
				entries={activity.data.pages.flatMap((page) => page.items)}
				showHeader={false}
			/>
			{activity.error ? (
				<p role="alert" className="text-danger text-[13px]">
					{errorMessage(activity.error)}
				</p>
			) : null}
			{activity.hasNextPage ? (
				<Button
					variant="outline"
					disabled={activity.isFetchingNextPage}
					onClick={() => void activity.fetchNextPage()}
				>
					{activity.isFetchingNextPage ? "Loading…" : "Load more"}
				</Button>
			) : null}
		</div>
	);
}
