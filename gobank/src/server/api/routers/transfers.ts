import { z } from "zod";
import { centavos, optionalText } from "~/lib/schemas";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { findUser, PARTY } from "~/server/services/directory";
import { transfer } from "~/server/services/ledger";

export const transfersRouter = createTRPCRouter({
  recipient: protectedProcedure
    .input(z.object({ to: z.string().min(1) }))
    .query(({ ctx, input }) => findUser(ctx.db, input.to, ctx.userId)),

  send: protectedProcedure
    .input(
      z.object({
        to: z.string().min(1),
        amount: centavos,
        note: optionalText(120),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const receiver = await findUser(ctx.db, input.to, ctx.userId);
      const sender = await ctx.db.user.findUniqueOrThrow({
        where: { id: ctx.userId },
        select: PARTY,
      });
      return ctx.db.$transaction((tx) =>
        transfer(tx, sender, receiver, input.amount, input.note),
      );
    }),
});
