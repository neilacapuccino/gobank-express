import { z } from "zod";
import { centavos } from "~/lib/schemas";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { spend } from "~/server/services/ledger";

export const billsRouter = createTRPCRouter({
  billers: publicProcedure.query(({ ctx }) =>
    ctx.db.biller.findMany({
      where: { active: true },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),
  ),

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
    .mutation(async ({ ctx, input }) => {
      const biller = await ctx.db.biller.findUniqueOrThrow({
        where: { id: input.billerId, active: true },
      });
      return ctx.db.$transaction((tx) =>
        spend(tx, {
          userId: ctx.userId,
          kind: "bill",
          title: `${biller.name} bill`,
          amount: input.amount,
          billerId: biller.id,
          details: { accountNumber: input.accountNumber },
        }),
      );
    }),
});
