import { z } from "zod";
import { centavos, optionalText } from "~/lib/schemas";
import { createTRPCRouter, protectedProcedure } from "~/server/trpc";
import { findRecipient, sendMoney } from "./transfers.service";

export const transfersRouter = createTRPCRouter({
  recipient: protectedProcedure
    .input(z.object({ to: z.string().min(1) }))
    .query(({ ctx, input }) => findRecipient(input.to, ctx.userId)),

  send: protectedProcedure
    .input(
      z.object({
        to: z.string().min(1),
        amount: centavos,
        note: optionalText(120),
      }),
    )
    .mutation(({ ctx, input }) =>
      sendMoney(ctx.userId, input.to, input.amount, input.note),
    ),
});
