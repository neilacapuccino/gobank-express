"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "~/shared/lib/cn";
import { dateTime, peso } from "~/shared/lib/format";
import { MAX_TRANSACTION_CENTAVOS } from "~/shared/lib/money";
import { Button } from "~/shared/ui/button";
import { FormError, RecipientIdentity } from "~/shared/ui/money-form-ui";
import { PageHeader } from "~/shared/ui/page-header";
import { useSpendLimit } from "~/shared/hooks/use-spend-limit";
import { CardPicker } from "~/features/card/components/card-picker";
import { errorMessage } from "~/trpc/error-message";
import { api, type RouterOutputs } from "~/trpc/react";

type MoneyRequest = RouterOutputs["notifications"]["list"]["items"][number];
type Direction = "received" | "sent";

const DIRECTIONS: Direction[] = ["received", "sent"];

function DirectionSwitch({
	selected,
	onSelect,
}: {
	selected: Direction;
	onSelect: (direction: Direction) => void;
}) {
	return (
		<div
			className="border-line bg-surface-sunken mb-5 grid grid-cols-2 gap-1 rounded-2xl border p-1"
			aria-label="Request direction"
		>
			{DIRECTIONS.map((direction) => (
				<button
					key={direction}
					type="button"
					aria-pressed={selected === direction}
					onClick={() => onSelect(direction)}
					className={cn(
						"h-11 rounded-xl text-[14px] font-medium capitalize transition-colors",
						selected === direction
							? "bg-surface-raised text-ink"
							: "text-ink-muted hover:text-ink",
					)}
				>
					{direction}
				</button>
			))}
		</div>
	);
}

function EmptyRequests({ direction }: { direction: Direction }) {
	return (
		<div className="border-line flex flex-col items-center gap-4 rounded-2xl border px-5 py-10">
			<Bell size={28} className="text-ink-muted" aria-hidden />
			<p className="text-ink-muted text-[14px]">No {direction} requests</p>
		</div>
	);
}

function SentRequestActions({ id }: { id: string }) {
	const cancel = api.requests.cancel.useMutation();

	return (
		<div className="mt-4">
			<FormError error={errorMessage(cancel.error)} />
			<Button
				variant="outline"
				disabled={cancel.isPending}
				onClick={() => cancel.mutate({ id })}
			>
				{cancel.isPending ? "Cancelling…" : "Cancel request"}
			</Button>
		</div>
	);
}

function ReceivedRequestActions({ id }: { id: string }) {
	const limit = useSpendLimit(MAX_TRANSACTION_CENTAVOS);
	const [reviewing, setReviewing] = useState(false);

	const respond = api.requests.respond.useMutation({
		onSuccess: () => setReviewing(false),
	});

	const startReview = () => {
		respond.reset();
		setReviewing(true);
	};

	const leaveReview = () => {
		setReviewing(false);
		respond.reset();
	};

	if (reviewing) {
		return (
			<div className="border-line mt-4 border-t pt-4">
				<p className="text-ink-soft mb-3 text-[13px]">
					Pay from your main account?
				</p>

				<CardPicker
					cards={limit.cards}
					value={limit.card}
					onChange={limit.setCard}
					disabled={respond.isPending}
				/>

				<FormError error={errorMessage(respond.error)} />

				<Button
					disabled={respond.isPending}
					onClick={() => respond.mutate({ id, accept: true, card: limit.card })}
				>
					{respond.isPending ? "Paying…" : "Confirm payment"}
				</Button>
				<Button
					variant="ghost"
					disabled={respond.isPending}
					onClick={leaveReview}
				>
					Back
				</Button>
			</div>
		);
	}

	return (
		<div className="mt-4">
			<FormError error={errorMessage(respond.error)} />

			<div className="grid grid-cols-2 gap-3">
				<Button
					variant="outline"
					disabled={respond.isPending}
					onClick={() => respond.mutate({ id, accept: false })}
				>
					{respond.isPending ? "Declining…" : "Decline"}
				</Button>
				<Button disabled={respond.isPending} onClick={startReview}>
					Pay
				</Button>
			</div>
		</div>
	);
}

function RequestFooter({
	request,
	received,
}: {
	request: MoneyRequest;
	received: boolean;
}) {
	if (request.status === "pending") {
		return received ? (
			<ReceivedRequestActions id={request.id} />
		) : (
			<SentRequestActions id={request.id} />
		);
	}

	if (!request.reference) return null;

	return (
		<Link
			href={`/transactions/${request.reference}`}
			className="text-brand mt-4 inline-block text-[13px] font-medium hover:underline"
		>
			View receipt
		</Link>
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

			<RequestFooter request={request} received={received} />
		</article>
	);
}

export function NotificationsScreen() {
	const [direction, setDirection] = useState<Direction>("received");

	const requests = api.notifications.list.useInfiniteQuery(
		{ requestDirection: direction, limit: 20 },
		{ getNextPageParam: (page) => page.next ?? undefined },
	);

	const items = requests.data?.pages.flatMap((page) => page.items) ?? [];
	const isEmpty = !requests.isLoading && !requests.error && items.length === 0;

	const retry = () => {
		if (requests.isFetchNextPageError) void requests.fetchNextPage();
		else void requests.refetch();
	};

	return (
		<div className="flex flex-1 flex-col">
			<PageHeader title="Notifications" back="/dashboard" />

			<div className="pt-7">
				<DirectionSwitch selected={direction} onSelect={setDirection} />

				{requests.isLoading ? (
					<p
						role="status"
						className="text-ink-muted py-8 text-center text-[14px]"
					>
						Loading requests…
					</p>
				) : null}

				{isEmpty ? <EmptyRequests direction={direction} /> : null}

				{items.length > 0 ? (
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
							onClick={retry}
						>
							{requests.isFetching ? "Retrying…" : "Retry"}
						</Button>
					</div>
				) : null}

				{!requests.error && requests.hasNextPage ? (
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
		</div>
	);
}
