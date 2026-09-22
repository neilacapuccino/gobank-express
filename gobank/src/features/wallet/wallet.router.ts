import { z } from "zod";
import { centavos, mobile } from "~/shared/lib/schemas";
import { createTRPCRouter, protectedProcedure } from "~/server/trpc";
import { buyLoad, deposit } from "./wallet.service";

export const walletRouter = createTRPCRouter({
  deposit: protectedProcedure
    .input(z.object({ amount: centavos.max(5_000_000) }))
    .mutation(({ ctx, input }) => deposit(ctx.userId, input.amount)),

  load: protectedProcedure
    .input(
      z.object({
        mobile: mobile.pipe(z.string({ message: "Enter a mobile number" })),
        amount: centavos.max(1_000_000),
      }),
    )
    .mutation(({ ctx, input }) =>
      buyLoad(ctx.userId, input.mobile, input.amount),
    ),
});
