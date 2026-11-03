"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import {
	activateClientSession,
	clearClientSession,
	clientSessionId,
} from "../session-client";

export function SessionGuard({
	sessionId,
	children,
}: {
	sessionId: string;
	children: ReactNode;
}) {
	const queryClient = useQueryClient();
	const [ready, setReady] = useState(false);

	useEffect(() => {
		let active = true;
		let renewing = false;
		let expiresAt: string | null = null;

		const leave = () => {
			if (!active) return;
			active = false;
			clearClientSession();
			queryClient.clear();
			setReady(false);
			window.location.replace("/signin");
		};
		const post = (action: "end" | "resume") =>
			fetch("/api/session", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ action, sessionId }),
				cache: "no-store",
			});

		if (clientSessionId() !== sessionId) {
			void post("end").then(leave, leave);
			return () => {
				active = false;
			};
		}

		activateClientSession(sessionId);
		setReady(true);
		const resume = async () => {
			if (!active || renewing) return;
			renewing = true;
			try {
				const response = await post("resume");
				if (!active) return;
				if (response.status === 401 || response.status === 403) {
					leave();
					return;
				}
				if (!response.ok) throw new Error("Session check failed");
				const result = (await response.json()) as { expiresAt: string };
				expiresAt = result.expiresAt;
			} catch {
				if (expiresAt && Date.parse(expiresAt) <= Date.now()) leave();
			} finally {
				renewing = false;
			}
		};

		const close = () => {
			if (!expiresAt) return;
			const body = new Blob(
				[JSON.stringify({ action: "close", sessionId, expiresAt })],
				{ type: "application/json" },
			);
			void fetch("/api/session", {
				method: "POST",
				body,
				keepalive: true,
			}).catch(() => undefined);
		};
		const onVisible = () => {
			if (document.visibilityState === "visible") void resume();
		};
		void resume();
		const timer = window.setInterval(onVisible, 60_000);
		window.addEventListener("pagehide", close);
		window.addEventListener("pageshow", onVisible);
		document.addEventListener("visibilitychange", onVisible);
		return () => {
			close();
			active = false;
			window.clearInterval(timer);
			window.removeEventListener("pagehide", close);
			window.removeEventListener("pageshow", onVisible);
			document.removeEventListener("visibilitychange", onVisible);
		};
	}, [sessionId, queryClient]);

	if (ready) return children;
	return (
		<p role="status" className="text-ink-muted py-8 text-center text-sm">
			Checking your session…
		</p>
	);
}
