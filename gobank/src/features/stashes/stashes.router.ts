import { z } from "zod";
import { centavos } from "~/shared/lib/schemas";
import { createTRPCRouter, protectedProcedure } from "~/server/trpc";
import { STASH_NAME_MAX } from "./stashes.rules";
import {
	createStash,
	getStash,
	listStashes,
	moveMoney,
	removeStash,
	updateStash,
} from "./stashes.service";

const id = z.object({ id: z.string() });
const name = z.string().trim().min(1).max(STASH_NAME_MAX);

export const stashesRouter = createTRPCRouter({
	list: protectedProcedure.query(({ ctx }) => listStashes(ctx.userId)),

	get: protectedProcedure
		.input(id)
		.query(({ ctx, input }) => getStash(ctx.userId, input.id)),

	create: protectedProcedure
		.input(z.object({ name, targetAmount: centavos.nullish() }))
		.mutation(({ ctx, input }) =>
			createStash(ctx.userId, input.name, input.targetAmount),
		),

	update: protectedProcedure
		.input(
			id.extend({ name: name.optional(), targetAmount: centavos.nullish() }),
		)
		.mutation(({ ctx, input: { id, ...fields } }) =>
			updateStash(ctx.userId, id, fields),
		),

	move: protectedProcedure
		.input(id.extend({ amount: centavos, direction: z.enum(["in", "out"]) }))
		.mutation(({ ctx, input }) =>
			moveMoney(ctx.userId, input.id, input.amount, input.direction),
		),

	remove: protectedProcedure
		.input(id)
		.mutation(({ ctx, input }) => removeStash(ctx.userId, input.id)),
});
