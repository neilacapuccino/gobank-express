import { accountRouter } from "~/features/account/account.router";
import { activityRouter } from "~/features/activity/activity.router";
import { authRouter } from "~/features/auth/auth.router";
import { billsRouter } from "~/features/bills/bills.router";
import { bitcoinRouter } from "~/features/bitcoin/bitcoin.router";
import { cardRouter } from "~/features/card/card.router";
import { depositRouter } from "~/features/deposit/deposit.router";
import { loadRouter } from "~/features/load/load.router";
import { notificationsRouter } from "~/features/notifications/notifications.router";
import { requestsRouter } from "~/features/requests/requests.router";
import { rewardsRouter } from "~/features/rewards/rewards.router";
import { stashesRouter } from "~/features/stashes/stashes.router";
import { transfersRouter } from "~/features/transfers/transfers.router";
import { createCallerFactory, createTRPCRouter } from "~/server/trpc";

export const appRouter = createTRPCRouter({
	account: accountRouter,
	activity: activityRouter,
	auth: authRouter,
	bills: billsRouter,
	bitcoin: bitcoinRouter,
	card: cardRouter,
	deposit: depositRouter,
	load: loadRouter,
	notifications: notificationsRouter,
	requests: requestsRouter,
	rewards: rewardsRouter,
	stashes: stashesRouter,
	transfers: transfersRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
