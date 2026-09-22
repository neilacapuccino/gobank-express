import { accountRouter } from "~/features/account/account.router";
import { authRouter } from "~/features/auth/auth.router";
import { billsRouter } from "~/features/bills/bills.router";
import { cardRouter } from "~/features/card/card.router";
import { requestsRouter } from "~/features/requests/requests.router";
import { rewardsRouter } from "~/features/rewards/rewards.router";
import { stashesRouter } from "~/features/stashes/stashes.router";
import { transfersRouter } from "~/features/transfers/transfers.router";
import { walletRouter } from "~/features/wallet/wallet.router";
import { createCallerFactory, createTRPCRouter } from "~/server/trpc";

export const appRouter = createTRPCRouter({
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
