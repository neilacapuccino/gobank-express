import { accountRouter } from "~/server/api/routers/account";
import { authRouter } from "~/server/api/routers/auth";
import { billsRouter } from "~/server/api/routers/bills";
import { cardRouter } from "~/server/api/routers/card";
import { healthRouter } from "~/server/api/routers/health";
import { requestsRouter } from "~/server/api/routers/requests";
import { rewardsRouter } from "~/server/api/routers/rewards";
import { stashesRouter } from "~/server/api/routers/stashes";
import { transfersRouter } from "~/server/api/routers/transfers";
import { walletRouter } from "~/server/api/routers/wallet";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

export const appRouter = createTRPCRouter({
  health: healthRouter,
  auth: authRouter,
  account: accountRouter,
  wallet: walletRouter,
  transfers: transfersRouter,
  requests: requestsRouter,
  bills: billsRouter,
  stashes: stashesRouter,
  card: cardRouter,
  rewards: rewardsRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
