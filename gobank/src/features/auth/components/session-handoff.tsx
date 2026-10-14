"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { activateClientSession } from "../session-client";

export function SessionHandoff({ sessionId }: { sessionId: string }) {
	const router = useRouter();
	const queryClient = useQueryClient();

	useEffect(() => {
		activateClientSession(sessionId);
		queryClient.clear();
		router.replace("/dashboard");
		router.refresh();
	}, [sessionId, queryClient, router]);

	return (
		<p role="status" className="text-ink-muted py-8 text-center text-sm">
			Opening your account…
		</p>
	);
}
