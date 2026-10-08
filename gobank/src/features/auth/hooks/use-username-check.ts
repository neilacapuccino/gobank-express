import { useDebouncedValue } from "~/shared/hooks/use-debounced-value";
import { api } from "~/trpc/react";
import { validateUsername, type UsernameCheck } from "../auth.rules";

export function useUsernameCheck(username: string) {
	const debounced = useDebouncedValue(username, 380);
	const local = validateUsername(username);
	const settled = debounced === username;

	const lookup = api.auth.usernameAvailable.useQuery(
		{ username: debounced },
		{ enabled: local.state === "available" && settled },
	);

	let check: UsernameCheck = local;
	if (local.state === "available") {
		if (!settled || lookup.isPending) {
			check = { state: "checking" };
		} else if (lookup.isError) {
			check = { state: "error", message: "Could not check this username." };
		} else {
			check = lookup.data
				? { state: "available" }
				: { state: "taken", message: "Already taken" };
		}
	}
	return { check, retry: () => lookup.refetch() };
}
