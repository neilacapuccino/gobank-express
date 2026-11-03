"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GoogleMark } from "~/features/auth/components/google-mark";
import {
	GOOGLE_LINK_CHANNEL,
	GOOGLE_LINK_NOTICES,
} from "~/features/auth/google/google.rules";

const LINK_URL = "/api/auth/google?mode=link";
const POPUP_FEATURES = "popup,width=480,height=640";

export function GmailLink({ gmail }: { gmail?: string | null }) {
	const router = useRouter();
	const [notice, setNotice] = useState<string | null>(null);

	useEffect(() => {
		const channel = new BroadcastChannel(GOOGLE_LINK_CHANNEL);

		channel.onmessage = ({ data }: MessageEvent<unknown>) => {
			if (typeof data !== "string") return;
			if (data === "linked") router.refresh();
			setNotice(data === "linked" ? null : (GOOGLE_LINK_NOTICES[data] ?? null));
		};

		return () => channel.close();
	}, [router]);

	const linkGoogle = () => {
		setNotice(null);
		const popup = window.open(LINK_URL, "gobank-google-link", POPUP_FEATURES);
		if (!popup) setNotice("Allow pop-ups for GoBank to link Google.");
	};

	return (
		<div className="flex flex-col gap-1.5">
			<span className="text-ink-soft text-[13px] font-medium">Gmail</span>

			<div
				className={
					gmail
						? "border-brand-line bg-brand-soft text-ink flex items-center gap-2.5 rounded-xl border px-3.5 py-4 text-[14px]"
						: "border-line text-ink-muted flex items-center gap-2.5 rounded-xl border py-2.5 pr-2.5 pl-3.5 text-[14px]"
				}
			>
				<GoogleMark />
				<span className="flex-1 truncate">{gmail ?? "Not linked"}</span>

				{gmail ? null : (
					<button
						type="button"
						onClick={linkGoogle}
						className="border-line-strong text-ink hover:bg-surface-raised focus-visible:ring-brand/40 h-9 shrink-0 rounded-lg border px-3.5 text-[13px] font-medium outline-none focus-visible:ring-2"
					>
						Link Google
					</button>
				)}
			</div>

			<p
				role={notice ? "alert" : undefined}
				className={
					notice ? "text-danger text-[12.5px]" : "text-ink-muted text-[12.5px]"
				}
			>
				{notice ??
					(gmail
						? "Friends can send money to this linked Gmail address."
						: "Link a Gmail to sign in with Google and get paid by email.")}
			</p>
		</div>
	);
}
