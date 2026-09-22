import type { TRPCClientErrorLike } from "@trpc/client";
import type { AppRouter } from "~/server/api/root";

export function errorMessage(error: TRPCClientErrorLike<AppRouter> | null) {
  if (!error) return null;
  const fields = error.data?.zodError?.fieldErrors ?? {};
  return Object.values(fields).flat()[0] ?? error.message;
}
