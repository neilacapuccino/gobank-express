import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { centavos, optionalText } from "~/lib/schemas";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { findUser, PARTY } from "~/server/services/directory";
import { transfer } from "~/server/services/ledger";

export const requestsRouter = createTRPCRouter({
  list: protectedProcedure.query(({ ctx }) =>
    ctx.db.moneyRequest.findMany({
      where: { OR: [{ requesterId: ctx.userId }, { payerId: ctx.userId }] },
      include: { requester: { select: PARTY }, payer: { select: PARTY } },
      orderBy: { createdAt: "desc" },
    }),
  ),

  create: protectedProcedure
    .input(
      z.object({
        from: z.string().min(1),
        amount: centavos,
        note: optionalText(120),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const payer = await findUser(ctx.db, input.from, ctx.userId);
      return ctx.db.moneyRequest.create({
        data: {
          requesterId: ctx.userId,
          payerId: payer.id,
          amount: input.amount,
          note: input.note,
        },
      });
    }),

  respond: protectedProcedure
    .input(z.object({ id: z.string(), accept: z.boolean() }))
    .mutation(({ ctx, input }) =>
      ctx.db.$transaction(async (tx) => {
        const claimed = await tx.moneyRequest.updateMany({
          where: { id: input.id, payerId: ctx.userId, status: "pending" },
          data: { status: input.accept ? "paid" : "declined" },
        });
        if (claimed.count === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "This request is no longer open",
          });
        }
        if (!input.accept) return null;

        const request = await tx.moneyRequest.findUniqueOrThrow({
          where: { id: input.id },
          include: { requester: { select: PARTY }, payer: { select: PARTY } },
        });
        const sent = await transfer(
          tx,
          request.payer,
          request.requester,
          request.amount,
          request.note,
        );
        await tx.moneyRequest.update({
          where: { id: request.id },
          data: { reference: sent.reference },
        });
        return sent;
      }),
    ),

  cancel: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.db.moneyRequest.update({
        where: { id: input.id, requesterId: ctx.userId, status: "pending" },
        data: { status: "cancelled" },
      }),
    ),
});
