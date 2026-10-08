"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
	FormError,
	RecipientIdentity,
} from "~/features/transfers/components/money-form-ui";
import { cn } from "~/shared/lib/cn";
import { dateTime, peso } from "~/shared/lib/format";
import { Button } from "~/shared/ui/button";
import { errorMessage } from "~/trpc/error-message";
import { api, type RouterOutputs } from "~/trpc/react";

type MoneyRequest = RouterOutputs["requests"]["list"]["items"][number];
type Direction = "received" | "sent";

export function RequestNotifications() {
	const [direction, setDirection] = useState<Direction>("received");
	const requests = api.requests.list.useInfiniteQuery(
		{ requestDirection: direction, limit: 20 },
		{ getNextPageParam: (page) => page.next ?? undefined },
	);
	const items = requests.data?.pages.flatMap((page) => page.items) ?? [];

	return (
		<div className="pt-7">
			<div
				className="border-line bg-surface-sunken mb-5 grid grid-cols-2 gap-1 rounded-2xl border p-1"
				aria-label="Request direction"
			>
				{(["received", "sent"] as const).map((value) => (
					<button
						key={value}
						type="button"
						aria-pressed={direction === value}
						onClick={() => setDirection(value)}
						className={cn(
							"h-11 rounded-xl text-[14px] font-medium capitalize transition-colors",
							direction === value
								? "bg-surface-raised text-ink"
								: "text-ink-muted hover:text-ink",
						)}
					>
						{value}
					</button>
				))}
			</div>
			{requests.isLoading ? (
				<p
					role="status"
					className="text-ink-muted py-8 text-center text-[14px]"
				>
					Loading requests…
				</p>
			) : !items.length && !requests.error ? (
				<div className="border-line flex flex-col items-center gap-4 rounded-2xl border px-5 py-10">
					<Bell size={28} className="text-ink-muted" aria-hidden />
					<p className="text-ink-muted text-[14px]">No {direction} requests</p>
				</div>
			) : items.length ? (
				<ul className="space-y-4">
					{items.map((request) => (
						<li key={request.id}>
							<RequestCard
								request={request}
								received={direction === "received"}
							/>
						</li>
					))}
				</ul>
			) : null}
			{requests.error ? (
				<div className="mt-5">
					<FormError error={errorMessage(requests.error)} />
					<Button
						variant="ghost"
						disabled={requests.isFetching}
						onClick={() => {
							if (requests.isFetchNextPageError) void requests.fetchNextPage();
							else void requests.refetch();
						}}
					>
						{requests.isFetching ? "Retrying…" : "Retry"}
					</Button>
				</div>
			) : requests.hasNextPage ? (
				<Button
					variant="outline"
					className="mt-5"
					disabled={requests.isFetching}
					onClick={() => void requests.fetchNextPage()}
				>
					{requests.isFetchingNextPage ? "Loading…" : "Load more"}
				</Button>
			) : null}
		</div>
	);
}

function RequestCard({
	request,
	received,
}: {
	request: MoneyRequest;
	received: boolean;
}) {
	return (
		<article className="border-line rounded-2xl border p-4">
			<RecipientIdentity
				recipient={received ? request.requester : request.payer}
			/>
			<div className="mt-5 flex flex-wrap items-center justify-between gap-2">
				<p className="text-ink text-[26px] font-semibold tracking-tight tabular-nums">
					{peso(request.amount)}
				</p>
				<span className="text-ink-muted text-[12px] capitalize">
					{request.status}
				</span>
			</div>
			{request.note ? (
				<p className="text-ink-soft mt-3 text-[14px] break-words">
					{request.note}
				</p>
			) : null}
			<p className="text-ink-muted mt-3 text-[12px]">
				{dateTime(request.createdAt)}
			</p>
			{request.status === "pending" ? (
				<RequestActions id={request.id} received={received} />
			) : request.reference ? (
				<Link
					href={`/transactions/${request.reference}`}
					className="text-brand mt-4 inline-block text-[13px] font-medium hover:underline"
				>
					View receipt
				</Link>
			) : null}
		</article>
	);
}

function RequestActions({ id, received }: { id: string; received: boolean }) {
	const utils = api.useUtils();
	const [reviewing, setReviewing] = useState(false);
	const refresh = async () => {
		await Promise.all([
			utils.requests.invalidate(),
			utils.account.invalidate(),
		]);
		setReviewing(false);
	};
	const respond = api.requests.respond.useMutation({ onSuccess: refresh });
	const cancel = api.requests.cancel.useMutation({ onSuccess: refresh });
	const pending = respond.isPending || cancel.isPending;
	const error = respond.error ?? cancel.error;

	if (!received) {
		return (
			<div className="mt-4">
				<FormError error={error ? errorMessage(error) : null} />
				<Button
					variant="outline"
					disabled={pending}
					onClick={() => cancel.mutate({ id })}
				>
					{cancel.isPending ? "Cancelling…" : "Cancel request"}
				</Button>
			</div>
		);
	}

	if (reviewing) {
		return (
			<div className="border-line mt-4 border-t pt-4">
				<p className="text-ink-soft mb-3 text-[13px]">
					Pay from your main account?
				</p>
				<FormError error={error ? errorMessage(error) : null} />
				<Button
					disabled={pending}
					onClick={() => respond.mutate({ id, accept: true })}
				>
					{pending ? "Paying…" : "Confirm payment"}
				</Button>
				<Button
					variant="ghost"
					disabled={pending}
					onClick={() => {
						setReviewing(false);
						respond.reset();
					}}
				>
					Back
				</Button>
			</div>
		);
	}

	return (
		<div className="mt-4">
			<FormError error={error ? errorMessage(error) : null} />
			<div className="grid grid-cols-2 gap-3">
				<Button
					variant="outline"
					disabled={pending}
					onClick={() => respond.mutate({ id, accept: false })}
				>
					{respond.isPending ? "Declining…" : "Decline"}
				</Button>
				<Button
					disabled={pending}
					onClick={() => {
						respond.reset();
						setReviewing(true);
					}}
				>
					Pay
				</Button>
			</div>
		</div>
	);
}
