"use client";

import { useEffect, useRef, useState } from "react";
import { errorMessage } from "~/trpc/error-message";
import { api, type RouterOutputs } from "~/trpc/react";

export type Recipient = RouterOutputs["transfers"]["recipient"];

export function useRecipientSearch(onFound: () => void) {
	const [value, setValue] = useState("");
	const [lookup, setLookup] = useState("");
	const [recipient, setRecipient] = useState<Recipient | null>(null);
	const latestValue = useRef("");

	useEffect(() => {
		const timer = setTimeout(() => setLookup(value.trim()), 300);
		return () => clearTimeout(timer);
	}, [value]);

	const result = api.transfers.recipient.useQuery(
		{ to: lookup },
		{ enabled: Boolean(lookup) && !recipient, retry: false },
	);
	const current = Boolean(value.trim()) && lookup === value.trim();
	const loading =
		Boolean(value.trim()) && !recipient && (!current || result.isFetching);
	const match =
		recipient ?? (current && !result.isError ? (result.data ?? null) : null);
	const error =
		current && !loading && !recipient ? errorMessage(result.error) : null;

	const change = (next: string) => {
		latestValue.current = next;
		setValue(next);
		setRecipient(null);
	};

	const select = (found: Recipient) => {
		const handle = `@${found.username}`;
		latestValue.current = handle;
		setValue(handle);
		setLookup(handle);
		setRecipient(found);
		onFound();
	};

	const find = () => {
		if (loading || !match || latestValue.current.trim() !== lookup) return;
		select(match);
	};

	return {
		value,
		recipient,
		match,
		error,
		loading,
		change,
		find,
		select,
		retry: () => void result.refetch(),
	};
}
