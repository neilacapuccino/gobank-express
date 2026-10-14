"use client";

import { SESSION_STORAGE_KEY } from "./session.rules";

type SessionWindow = Window & { gobankSessionId?: string };

export function activateClientSession(sessionId: string) {
	(window as SessionWindow).gobankSessionId = sessionId;
	try {
		sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
	} catch {
		return;
	}
}

export function clearClientSession() {
	delete (window as SessionWindow).gobankSessionId;
	try {
		sessionStorage.removeItem(SESSION_STORAGE_KEY);
	} catch {
		return;
	}
}

export function clientSessionId() {
	if (typeof window === "undefined") return null;
	const active = (window as SessionWindow).gobankSessionId;
	if (active) return active;
	try {
		const navigation = performance.getEntriesByType("navigation")[0] as
			PerformanceNavigationTiming | undefined;
		return navigation?.type === "reload"
			? sessionStorage.getItem(SESSION_STORAGE_KEY)
			: null;
	} catch {
		return null;
	}
}
