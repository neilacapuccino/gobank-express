"use client";

import { Bell, CheckCircle2, UserRound, X } from "lucide-react";
import Image from "next/image";
import { cn } from "~/shared/lib/cn";
import { dateTime, peso } from "~/shared/lib/format";
import { PageHeader } from "~/shared/ui/page-header";
import { errorMessage } from "~/trpc/error-message";
import { api } from "~/trpc/react";

export default function NotificationsPage() {
	const requests = api.requests.notifications.useQuery();

	return (
		<div className="flex flex-1 flex-col pb-10">
			<PageHeader title="Notifications" back="/dashboard" />

			<div className="mt-6">
				<div className="mb-4 flex items-center gap-2">
					<div className="bg-brand-soft text-brand grid h-9 w-9 place-items-center rounded-full">
						<Bell size={18} strokeWidth={1.8} />
					</div>

					<div>
						<h2 className="text-ink text-[15px] font-semibold">
							Notifications
						</h2>

						<p className="text-ink-muted text-[11px]">
							Requests and account activity
						</p>
					</div>
				</div>

				{requests.isLoading ? (
					<div className="bg-surface-sunken text-ink-muted rounded-2xl px-4 py-8 text-center text-[12px]">
						Loading notifications...
					</div>
				) : requests.error ? (
					<div className="bg-danger-soft text-danger rounded-2xl px-4 py-4 text-[12px]">
						{errorMessage(requests.error)}
					</div>
				) : !requests.data || requests.data.length === 0 ? (
					<div className="bg-surface-sunken flex flex-col items-center rounded-2xl px-5 py-10 text-center">
						<div className="bg-surface text-ink-muted grid h-14 w-14 place-items-center rounded-full">
							<Bell size={24} strokeWidth={1.7} />
						</div>

						<h3 className="text-ink mt-4 text-[14px] font-semibold">
							No notifications
						</h3>

						<p className="text-ink-muted mt-1 max-w-[260px] text-[11px] leading-relaxed">
							You&apos;re all caught up. New money requests will appear here.
						</p>
					</div>
				) : (
					<div className="space-y-3">
						{requests.data.map((request) => (
							<RequestCard
								key={request.id}
								request={request}
								onRefresh={() => void requests.refetch()}
							/>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

function RequestCard({
	request,
	onRefresh,
}: {
	request: {
		id: string;
		amount: number;
		note: string | null;
		createdAt: Date;
		requester: {
			id: string;
			username: string;
			fullName: string;
			profilePhoto: string | null;
		};
	};
	onRefresh: () => void;
}) {
	const respond = api.requests.respond.useMutation({
		onSuccess: () => {
			onRefresh();
		},
	});

	const handleResponse = (accept: boolean) => {
		respond.mutate({
			id: request.id,
			accept,
		});
	};

	return (
		<div className="bg-surface border-line rounded-2xl border p-4">
			<div className="flex items-start gap-3">
				{request.requester.profilePhoto ? (
					<div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full">
            <Image
              src={request.requester.profilePhoto}
              alt={`${request.requester.fullName}'s profile`}
              fill
              sizes="44px"
              unoptimized
              className="object-cover"
            />
          </div>
				) : (
					<div className="bg-brand-soft text-brand grid h-11 w-11 shrink-0 place-items-center rounded-full">
						<UserRound size={20} strokeWidth={1.8} />
					</div>
				)}

				<div className="min-w-0 flex-1">
					<div className="flex items-start justify-between gap-3">
						<div>
							<p className="text-ink text-[13px] font-semibold">
								{request.requester.fullName}
							</p>

							<p className="text-ink-muted mt-0.5 text-[11px]">
								@{request.requester.username}
							</p>
						</div>

						<span className="bg-brand-soft text-brand shrink-0 rounded-full px-2 py-1 text-[9px] font-semibold uppercase">
							Payment request
						</span>
					</div>

					<p className="text-ink mt-4 text-[14px] leading-relaxed">
						<strong>{request.requester.fullName}</strong>{" "}
						requested money from you.
					</p>

					<p className="text-ink mt-1 text-[26px] font-semibold tracking-tight tabular-nums">
						{peso(request.amount)}
					</p>

					{request.note ? (
						<div className="bg-surface-sunken mt-3 rounded-xl px-3 py-2">
							<p className="text-ink-muted text-[10px]">Note</p>

							<p className="text-ink mt-0.5 text-[12px]">
								{request.note}
							</p>
						</div>
					) : null}

					<p className="text-ink-faint mt-3 text-[10px]">
						{dateTime(request.createdAt)}
					</p>
				</div>
			</div>

			{respond.error ? (
				<p
					role="alert"
					className="bg-danger-soft text-danger mt-4 rounded-xl px-3 py-2 text-[11px]"
				>
					{errorMessage(respond.error)}
				</p>
			) : null}

			<div className="mt-4 grid grid-cols-2 gap-2">
				<button
					type="button"
					disabled={respond.isPending}
					onClick={() => handleResponse(false)}
					className={cn(
						"flex h-11 items-center justify-center gap-1.5 rounded-xl text-[12px] font-semibold transition-colors",
						respond.isPending
							? "bg-surface-sunken text-ink-soft/50 cursor-not-allowed"
							: "bg-surface-sunken text-ink hover:bg-surface-sunken/70",
					)}
				>
					<X size={15} />
					{respond.isPending ? "Processing..." : "Decline"}
				</button>

				<button
					type="button"
					disabled={respond.isPending}
					onClick={() => handleResponse(true)}
					className={cn(
						"flex h-11 items-center justify-center gap-1.5 rounded-xl text-[12px] font-semibold transition-colors",
						respond.isPending
							? "bg-surface-sunken text-ink-soft/50 cursor-not-allowed"
							: "bg-brand hover:bg-brand-hover text-white",
					)}
				>
					<CheckCircle2 size={15} />

					{respond.isPending
						? "Processing..."
						: `Pay ${peso(request.amount)}`}
				</button>
			</div>
		</div>
	);
}