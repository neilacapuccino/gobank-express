import { z } from "zod";
import { centavos } from "~/shared/lib/schemas";
import { createTRPCRouter, protectedProcedure } from "~/server/trpc";
import { GOAL_NAME_MAX } from "./goals.rules";
import {
	createGoal,
	getGoal,
	listGoals,
	moveMoney,
	removeGoal,
	updateGoal,
} from "./goals.service";

const id = z.object({ id: z.string() });
const name = z.string().trim().min(1).max(GOAL_NAME_MAX);

export const goalsRouter = createTRPCRouter({
	list: protectedProcedure.query(({ ctx }) => listGoals(ctx.userId)),

	get: protectedProcedure
		.input(id)
		.query(({ ctx, input }) => getGoal(ctx.userId, input.id)),

	create: protectedProcedure
		.input(z.object({ name, targetAmount: centavos.nullish() }))
		.mutation(({ ctx, input }) =>
			createGoal(ctx.userId, input.name, input.targetAmount),
		),

	update: protectedProcedure
		.input(
			id.extend({ name: name.optional(), targetAmount: centavos.nullish() }),
		)
		.mutation(({ ctx, input: { id, ...fields } }) =>
			updateGoal(ctx.userId, id, fields),
		),

	move: protectedProcedure
		.input(id.extend({ amount: centavos, direction: z.enum(["in", "out"]) }))
		.mutation(({ ctx, input }) =>
			moveMoney(ctx.userId, input.id, input.amount, input.direction),
		),

	remove: protectedProcedure
		.input(id)
		.mutation(({ ctx, input }) => removeGoal(ctx.userId, input.id)),
});
