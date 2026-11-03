import type { TRPCClientErrorLike } from "@trpc/client";
import type { AppRouter } from "~/server/root";

export function errorMessage(error: TRPCClientErrorLike<AppRouter> | null) {
	if (!error) return null;

	const fieldErrors = error.data?.zodError?.fieldErrors ?? {};
	const firstFieldError = Object.values(fieldErrors).flat()[0];

	return firstFieldError ?? error.message;
}
