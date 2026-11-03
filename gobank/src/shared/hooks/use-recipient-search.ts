"use client";

import { useEffect, useRef, useState } from "react";
import { errorMessage } from "~/trpc/error-message";
import { api, type RouterOutputs } from "~/trpc/react";

export type Recipient = RouterOutputs["transfers"]["recipient"];

const TYPING_PAUSE_MS = 300;

export function useRecipientSearch(onFound: () => void) {
	const [value, setValue] = useState("");
	const [lookup, setLookup] = useState("");
	const [recipient, setRecipient] = useState<Recipient | null>(null);
	const latestValue = useRef("");

	useEffect(() => {
		const timer = setTimeout(() => setLookup(value.trim()), TYPING_PAUSE_MS);
		return () => clearTimeout(timer);
	}, [value]);

	const result = api.transfers.recipient.useQuery(
		{ to: lookup },
		{ enabled: Boolean(lookup) && !recipient, retry: false },
	);

	const typed = value.trim();
	const lookupMatchesTyping = typed !== "" && lookup === typed;
	const waitingForResult = !lookupMatchesTyping || result.isFetching;

	const loading = typed !== "" && !recipient && waitingForResult;

	const foundNow =
		lookupMatchesTyping && !result.isError ? (result.data ?? null) : null;
	const match = recipient ?? foundNow;

	const showError = lookupMatchesTyping && !loading && !recipient;
	const error = showError ? errorMessage(result.error) : null;

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
		const stillTheSameSearch = latestValue.current.trim() === lookup;
		if (loading || !match || !stillTheSameSearch) return;

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
