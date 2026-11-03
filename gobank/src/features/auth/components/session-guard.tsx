"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import {
	activateClientSession,
	clearClientSession,
	clientSessionId,
} from "../session.client";

const CHECK_EVERY_MS = 60_000;

const postSession = (body: Record<string, string>, keepalive = false) =>
	fetch("/api/session", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
		cache: "no-store",
		keepalive,
	});

const isSignedOut = (response: Response) =>
	response.status === 401 || response.status === 403;

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

		const signOutHere = () => {
			if (!active) return;

			active = false;
			clearClientSession();
			queryClient.clear();
			setReady(false);
			window.location.replace("/signin");
		};

		const openedInAnotherTab = clientSessionId() !== sessionId;
		if (openedInAnotherTab) {
			void postSession({ action: "end", sessionId }).then(
				signOutHere,
				signOutHere,
			);
			return () => {
				active = false;
			};
		}

		activateClientSession(sessionId);
		setReady(true);

		const renew = async () => {
			if (!active || renewing) return;
			renewing = true;

			try {
				const response = await postSession({ action: "resume", sessionId });
				if (!active) return;

				if (isSignedOut(response)) {
					signOutHere();
					return;
				}

				if (!response.ok) throw new Error("Session check failed");

				const result = (await response.json()) as { expiresAt: string };
				expiresAt = result.expiresAt;
			} catch {
				const expired =
					expiresAt !== null && Date.parse(expiresAt) <= Date.now();
				if (expired) signOutHere();
			} finally {
				renewing = false;
			}
		};

		const shortenOnLeave = () => {
			if (!expiresAt) return;

			void postSession({ action: "close", sessionId, expiresAt }, true).catch(
				() => undefined,
			);
		};

		const renewIfVisible = () => {
			if (document.visibilityState === "visible") void renew();
		};

		void renew();
		const timer = window.setInterval(renewIfVisible, CHECK_EVERY_MS);
		window.addEventListener("pagehide", shortenOnLeave);
		window.addEventListener("pageshow", renewIfVisible);
		document.addEventListener("visibilitychange", renewIfVisible);

		return () => {
			shortenOnLeave();
			active = false;
			window.clearInterval(timer);
			window.removeEventListener("pagehide", shortenOnLeave);
			window.removeEventListener("pageshow", renewIfVisible);
			document.removeEventListener("visibilitychange", renewIfVisible);
		};
	}, [sessionId, queryClient]);

	if (ready) return children;

	return (
		<p role="status" className="text-ink-muted py-8 text-center text-sm">
			Checking your session…
		</p>
	);
}
