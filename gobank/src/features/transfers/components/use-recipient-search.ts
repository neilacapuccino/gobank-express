"use client";

import { useState } from "react";
import { api, type RouterOutputs } from "~/trpc/react";

export type Recipient = RouterOutputs["transfers"]["recipient"];

export function useRecipientSearch(onFound: () => void) {
	const utils = api.useUtils();
	const [value, setValue] = useState("");
	const [recipient, setRecipient] = useState<Recipient | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const change = (next: string) => {
		setValue(next);
		setRecipient(null);
		setError(null);
	};

	const find = async (handle = value) => {
		if (!handle.trim() || loading) return;
		setValue(handle);
		setError(null);
		setLoading(true);
		try {
			const found = await utils.transfers.recipient.fetch(
				{ to: handle.trim() },
				{ staleTime: 0 },
			);
			setRecipient(found);
			onFound();
		} catch (cause) {
			setError(
				cause instanceof Error ? cause.message : "Could not find recipient.",
			);
		} finally {
			setLoading(false);
		}
	};

	return { value, recipient, error, loading, change, find };
}
