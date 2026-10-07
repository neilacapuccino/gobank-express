import { z } from "zod";
import { optionalText } from "~/shared/lib/schemas";
import { createTRPCRouter, protectedProcedure } from "~/server/trpc";
import {
  findRecipient,
  getRecentRecipients,
  sendMoney,
} from "./transfers.service";

export const transfersRouter = createTRPCRouter({
  recent: protectedProcedure.query(({ ctx }) =>
    getRecentRecipients(ctx.userId),
  ),

  recipient: protectedProcedure
    .input(z.object({ to: z.string().min(1) }))
    .query(({ ctx, input }) => findRecipient(input.to, ctx.userId)),

  send: protectedProcedure
    .input(
      z.object({
        to: z.string().min(1),
        amount: z.number().int().positive().max(2_147_483_647),
        note: optionalText(120),
      }),
    )
    .mutation(({ ctx, input }) =>
      sendMoney(ctx.userId, input.to, input.amount, input.note),
    ),
});