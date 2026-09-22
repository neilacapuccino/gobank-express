import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { MAX_STASHES } from "~/lib/money";
import { centavos } from "~/lib/schemas";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { moveStash } from "~/server/services/ledger";

const name = z.string().trim().min(1).max(40);

export const stashesRouter = createTRPCRouter({
  list: protectedProcedure.query(({ ctx }) =>
    ctx.db.stash.findMany({
      where: { userId: ctx.userId },
      orderBy: { createdAt: "asc" },
    }),
  ),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) =>
      ctx.db.stash.findUniqueOrThrow({
        where: { id: input.id, userId: ctx.userId },
        include: {
          transactions: { orderBy: { createdAt: "desc" }, take: 20 },
        },
      }),
    ),

  create: protectedProcedure
    .input(z.object({ name, goal: centavos.nullish() }))
    .mutation(async ({ ctx, input }) => {
      const count = await ctx.db.stash.count({
        where: { userId: ctx.userId },
      });
      if (count >= MAX_STASHES) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `You can have up to ${MAX_STASHES} Stashes`,
        });
      }
      return ctx.db.stash.create({ data: { ...input, userId: ctx.userId } });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: name.optional(),
        goal: centavos.nullish(),
      }),
    )
    .mutation(({ ctx, input: { id, ...data } }) =>
      ctx.db.stash.update({ where: { id, userId: ctx.userId }, data }),
    ),

  move: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        amount: centavos,
        direction: z.enum(["in", "out"]),
      }),
    )
    .mutation(({ ctx, input }) =>
      ctx.db.$transaction((tx) =>
        moveStash(
          tx,
          ctx.userId,
          input.id,
          input.direction === "in" ? input.amount : -input.amount,
        ),
      ),
    ),

  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.db.$transaction(async (tx) => {
        const stash = await tx.stash.findUniqueOrThrow({
          where: { id: input.id, userId: ctx.userId },
        });
        if (stash.balance > 0) {
          await moveStash(tx, ctx.userId, stash.id, -stash.balance);
        }
        await tx.stash.delete({ where: { id: stash.id } });
      }),
    ),
});
