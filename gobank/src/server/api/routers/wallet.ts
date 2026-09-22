import { z } from "zod";
import { formatMobile } from "~/lib/registration";
import { centavos, mobile } from "~/lib/schemas";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { post, spend } from "~/server/services/ledger";

export const walletRouter = createTRPCRouter({
  deposit: protectedProcedure
    .input(z.object({ amount: centavos.max(5_000_000) }))
    .mutation(({ ctx, input }) =>
      ctx.db.$transaction((tx) =>
        post(tx, {
          userId: ctx.userId,
          kind: "deposit",
          title: "Cash in",
          amount: input.amount,
        }),
      ),
    ),

  load: protectedProcedure
    .input(
      z.object({
        mobile: mobile.pipe(z.string({ message: "Enter a mobile number" })),
        amount: centavos.max(1_000_000),
      }),
    )
    .mutation(({ ctx, input }) =>
      ctx.db.$transaction((tx) =>
        spend(tx, {
          userId: ctx.userId,
          kind: "load",
          title: `Load for ${formatMobile(input.mobile)}`,
          amount: input.amount,
          details: { mobile: input.mobile },
        }),
      ),
    ),
});
