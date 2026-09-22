import { z } from "zod";
import { centavos, optionalText } from "~/shared/lib/schemas";
import { createTRPCRouter, protectedProcedure } from "~/server/trpc";
import {
  cancelRequest,
  listRequests,
  requestMoney,
  respondToRequest,
} from "./requests.service";

export const requestsRouter = createTRPCRouter({
  list: protectedProcedure.query(({ ctx }) => listRequests(ctx.userId)),

  create: protectedProcedure
    .input(
      z.object({
        from: z.string().min(1),
        amount: centavos,
        note: optionalText(120),
      }),
    )
    .mutation(({ ctx, input }) =>
      requestMoney(ctx.userId, input.from, input.amount, input.note),
    ),

  respond: protectedProcedure
    .input(z.object({ id: z.string(), accept: z.boolean() }))
    .mutation(({ ctx, input }) =>
      respondToRequest(ctx.userId, input.id, input.accept),
    ),

  cancel: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) => cancelRequest(ctx.userId, input.id)),
});
