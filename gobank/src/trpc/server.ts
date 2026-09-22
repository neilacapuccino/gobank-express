import "server-only";

import { headers } from "next/headers";
import { cache } from "react";

import { createCaller } from "~/server/root";
import { createTRPCContext } from "~/server/trpc";

const createContext = cache(async () =>
  createTRPCContext({ headers: new Headers(await headers()) }),
);

export const api = createCaller(createContext);
