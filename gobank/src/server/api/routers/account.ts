import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const accountRouter = createTRPCRouter({
  overview: protectedProcedure.query(({ ctx }) =>
    ctx.db.user.findUniqueOrThrow({
      where: { id: ctx.userId },
      select: {
        username: true,
        fullName: true,
        accountNumber: true,
        balance: true,
        points: true,
        _count: { select: { stashes: true } },
        transactions: { orderBy: { createdAt: "desc" }, take: 5 },
      },
    }),
  ),

  profile: protectedProcedure.query(({ ctx }) =>
    ctx.db.user.findUniqueOrThrow({
      where: { id: ctx.userId },
      select: {
        username: true,
        fullName: true,
        mobile: true,
        email: true,
        accountNumber: true,
        createdAt: true,
      },
    }),
  ),

  activity: protectedProcedure
    .input(
      z.object({
        cursor: z.string().nullish(),
        limit: z.number().int().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const items = await ctx.db.transaction.findMany({
        where: { userId: ctx.userId },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
      });
      const next = items.length > input.limit ? items.pop()?.id : null;
      return { items, next };
    }),

  transaction: protectedProcedure
    .input(z.object({ reference: z.string() }))
    .query(({ ctx, input }) =>
      ctx.db.transaction.findUniqueOrThrow({
        where: {
          reference_userId: { reference: input.reference, userId: ctx.userId },
        },
        include: {
          biller: true,
          stash: { select: { name: true } },
          counterparty: { select: { username: true, fullName: true } },
        },
      }),
    ),
});
