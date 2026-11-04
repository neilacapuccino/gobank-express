"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { cn } from "~/shared/lib/cn";
import { GoogleMark } from "~/features/auth/components/google-mark";
import {
	GOOGLE_LINK_CHANNEL,
	GOOGLE_LINK_NOTICES,
} from "~/features/auth/google/google.rules";
import { errorMessage } from "~/trpc/error-message";
import { api } from "~/trpc/react";

const LINK_URL = "/api/auth/google?mode=link";
const POPUP_FEATURES = "popup,width=480,height=640";

const ROW_BUTTON =
	"border-line-strong text-ink hover:bg-surface-raised focus-visible:ring-brand/40 h-9 shrink-0 rounded-lg border px-3.5 text-[13px] font-medium outline-none focus-visible:ring-2 disabled:opacity-45";

const DANGER_BUTTON =
	"bg-danger-strong enabled:hover:bg-danger-strong-hover h-9 shrink-0 rounded-lg px-3.5 text-[13px] font-medium text-white outline-none disabled:opacity-45";

function useLinkResult(onMessage: (status: string) => void) {
	useEffect(() => {
		const channel = new BroadcastChannel(GOOGLE_LINK_CHANNEL);

		channel.onmessage = ({ data }: MessageEvent<unknown>) => {
			if (typeof data === "string") onMessage(data);
		};

		return () => channel.close();
	}, [onMessage]);
}

function hintFor(linked: boolean, gmail: string | null) {
	if (!linked)
		return "Link a Gmail to sign in with Google and get paid by email.";
	if (gmail) return "Friends can send money to this linked Gmail address.";
	return "You can sign in with Google. Link a Gmail address to get paid by email.";
}

export function GmailLink({
	linked,
	gmail,
	editable = false,
}: {
	linked: boolean;
	gmail: string | null;
	editable?: boolean;
}) {
	const router = useRouter();
	const [notice, setNotice] = useState<string | null>(null);
	const [confirmingUnlink, setConfirmingUnlink] = useState(false);

	const unlink = api.account.unlinkGoogle.useMutation({
		onSuccess: () => {
			setConfirmingUnlink(false);
			setNotice(null);
			router.refresh();
		},
	});

	const showLinkResult = useCallback(
		(status: string) => {
			if (status === "linked") router.refresh();
			setNotice(
				status === "linked" ? null : (GOOGLE_LINK_NOTICES[status] ?? null),
			);
		},
		[router],
	);
	useLinkResult(showLinkResult);

	const linkGoogle = () => {
		setNotice(null);
		const popup = window.open(LINK_URL, "gobank-google-link", POPUP_FEATURES);
		if (!popup) setNotice("Allow pop-ups for GoBank to link Google.");
	};

	const error = errorMessage(unlink.error);
	const message = error ?? notice ?? hintFor(linked, gmail);

	return (
		<div className="flex flex-col gap-1.5">
			<span className="text-ink-soft text-[13px] font-medium">
				Google account
			</span>

			<div
				className={cn(
					"flex items-center gap-2.5 rounded-xl border py-2.5 pr-2.5 pl-3.5 text-[14px]",
					linked
						? "border-brand-line bg-brand-soft text-ink"
						: "border-line text-ink-muted",
				)}
			>
				<GoogleMark />
				<span className="min-h-9 flex-1 truncate leading-9">
					{linked ? (gmail ?? "Google account linked") : "Not linked"}
				</span>

				{editable && !linked ? (
					<button type="button" onClick={linkGoogle} className={ROW_BUTTON}>
						Link Google
					</button>
				) : null}

				{editable && linked && !confirmingUnlink ? (
					<button
						type="button"
						onClick={() => setConfirmingUnlink(true)}
						className={ROW_BUTTON}
					>
						Unlink
					</button>
				) : null}
			</div>

			{confirmingUnlink ? (
				<div
					role="region"
					aria-label="Unlink Google confirmation"
					className="border-line flex items-center justify-between gap-3 rounded-xl border p-3"
				>
					<p className="text-ink-soft text-[12.5px] leading-relaxed">
						Unlink Google? You can still sign in with your username and PIN.
					</p>
					<div className="flex shrink-0 gap-2">
						<button
							type="button"
							disabled={unlink.isPending}
							onClick={() => setConfirmingUnlink(false)}
							className={ROW_BUTTON}
						>
							Keep
						</button>
						<button
							type="button"
							disabled={unlink.isPending}
							onClick={() => unlink.mutate()}
							className={DANGER_BUTTON}
						>
							{unlink.isPending ? "Unlinking…" : "Unlink"}
						</button>
					</div>
				</div>
			) : null}

			<p
				role={error ? "alert" : undefined}
				className={cn(
					"text-[12.5px]",
					error ? "text-danger" : "text-ink-muted",
				)}
			>
				{message}
			</p>
		</div>
	);
}
