"use client";

import { SESSION_STORAGE_KEY } from "./session.rules";

type SessionWindow = Window & { gobankSessionId?: string };

const sessionWindow = () => window as SessionWindow;

function wasReloaded() {
	const [navigation] = performance.getEntriesByType("navigation") as
		PerformanceNavigationTiming[] | [];

	return navigation?.type === "reload";
}

export function activateClientSession(sessionId: string) {
	sessionWindow().gobankSessionId = sessionId;

	try {
		sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
	} catch {
		return;
	}
}

export function clearClientSession() {
	delete sessionWindow().gobankSessionId;

	try {
		sessionStorage.removeItem(SESSION_STORAGE_KEY);
	} catch {
		return;
	}
}

export function clientSessionId() {
	if (typeof window === "undefined") return null;

	const active = sessionWindow().gobankSessionId;
	if (active) return active;

	try {
		return wasReloaded() ? sessionStorage.getItem(SESSION_STORAGE_KEY) : null;
	} catch {
		return null;
	}
}
