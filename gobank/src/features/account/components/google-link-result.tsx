"use client";

import { useEffect } from "react";
import {
	GOOGLE_LINK_CHANNEL,
	GOOGLE_LINK_NOTICES,
} from "~/features/auth/google/google.rules";

export function GoogleLinkResult({ status }: { status: string }) {
	useEffect(() => {
		const channel = new BroadcastChannel(GOOGLE_LINK_CHANNEL);
		channel.postMessage(status);
		channel.close();

		window.close();
	}, [status]);

	return (
		<main className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
			<p className="text-ink text-[15px] font-medium">
				{GOOGLE_LINK_NOTICES[status]}
			</p>
			<p className="text-ink-muted text-[13px]">You can close this window.</p>
		</main>
	);
}
