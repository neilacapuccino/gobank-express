import { useDebouncedValue } from "~/shared/hooks/use-debounced-value";
import { api } from "~/trpc/react";
import { validateUsername, type UsernameCheck } from "../auth.rules";

const TYPING_PAUSE_MS = 380;

type Lookup = {
	waiting: boolean;
	failed: boolean;
	available: boolean | undefined;
};

function describeLookup({ waiting, failed, available }: Lookup): UsernameCheck {
	if (waiting) return { state: "checking" };
	if (failed) {
		return { state: "error", message: "Could not check this username." };
	}

	return available
		? { state: "available" }
		: { state: "taken", message: "Already taken" };
}

export function useUsernameCheck(username: string) {
	const debounced = useDebouncedValue(username, TYPING_PAUSE_MS);
	const local = validateUsername(username);
	const doneTyping = debounced === username;

	const lookup = api.auth.usernameAvailable.useQuery(
		{ username: debounced },
		{ enabled: local.state === "available" && doneTyping },
	);

	const check =
		local.state === "available"
			? describeLookup({
					waiting: !doneTyping || lookup.isPending,
					failed: lookup.isError,
					available: lookup.data,
				})
			: local;

	return { check, retry: () => lookup.refetch() };
}
