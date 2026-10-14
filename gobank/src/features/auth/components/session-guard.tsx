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
	const [status, setStatus] = useState<"checking" | "ready" | "error">(
		"checking",
	);

	useEffect(() => {
		let active = true;
		let renewing = false;
		let expiresAt: string | null = null;

		const leave = () => {
			if (!active) return;
			active = false;
			clearClientSession();
			queryClient.clear();
			setStatus("checking");
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
				setStatus("ready");
			} catch {
				if (active && !expiresAt) setStatus("error");
				else if (expiresAt && Date.parse(expiresAt) <= Date.now()) leave();
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

	if (status === "ready") return children;
	return (
		<div className="py-8 text-center text-sm">
			<p role="status" className="text-ink-muted">
				{status === "error"
					? "Unable to check your session."
					: "Checking your session…"}
			</p>
			{status === "error" && (
				<button
					type="button"
					className="text-brand mt-4 min-h-11 px-4 font-medium"
					onClick={() => window.location.reload()}
				>
					Try again
				</button>
			)}
		</div>
	);
}
