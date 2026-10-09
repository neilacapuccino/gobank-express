import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/trpc";
import { listNotifications } from "./notifications.service";

export const notificationsRouter = createTRPCRouter({
	list: protectedProcedure
		.input(
			z.object({
				requestDirection: z.enum(["received", "sent"]),
				cursor: z.string().min(1).nullish(),
				limit: z.number().int().min(1).max(50).default(20),
			}),
		)
		.query(({ ctx, input }) =>
			listNotifications(
				ctx.userId,
				input.requestDirection,
				input.cursor,
				input.limit,
			),
		),
});
