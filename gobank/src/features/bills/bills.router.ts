import { z } from "zod";
import { centavos } from "~/lib/schemas";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/trpc";
import { listBillers, payBill } from "./bills.service";

export const billsRouter = createTRPCRouter({
  billers: publicProcedure.query(() => listBillers()),

  pay: protectedProcedure
    .input(
      z.object({
        billerId: z.string(),
        accountNumber: z
          .string()
          .regex(/^\d{4,20}$/, "Check the account number"),
        amount: centavos,
      }),
    )
    .mutation(({ ctx, input }) =>
      payBill(ctx.userId, input.billerId, input.accountNumber, input.amount),
    ),
});
