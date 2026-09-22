import { useDebouncedValue } from "~/shared/hooks/use-debounced-value";
import { api } from "~/trpc/react";
import { validateUsername, type UsernameCheck } from "../auth.rules";

export function useUsernameCheck(username: string): UsernameCheck {
  const debounced = useDebouncedValue(username, 380);
  const local = validateUsername(username);
  const settled = debounced === username;

  const lookup = api.auth.usernameAvailable.useQuery(
    { username: debounced },
    { enabled: local.state === "available" && settled },
  );

  if (local.state !== "available") return local;
  if (!settled || lookup.data === undefined) return { state: "checking" };
  return lookup.data
    ? { state: "available" }
    : { state: "taken", message: "Already taken" };
}
