import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { env } from "~/env";
import { AppError, asDatabaseError, MESSAGES } from "~/server/errors";
import { currentSession } from "~/server/session";

type Context = { browserSession?: { id: string | null } };

const t = initTRPC.context<Context>().create({
	transformer: superjson,

	errorFormatter({ shape, error }) {
		const hideDetails =
			error.code === "INTERNAL_SERVER_ERROR" && env.NODE_ENV === "production";
		const zodError =
			error.cause instanceof ZodError ? error.cause.flatten() : null;

		return {
			...shape,
			message: hideDetails ? MESSAGES.unexpected : shape.message,
			data: { ...shape.data, zodError },
		};
	},
});

function toTRPCError(cause: unknown) {
	if (cause instanceof AppError) {
		return new TRPCError({ code: cause.code, message: cause.message });
	}

	const database = asDatabaseError(cause);

	if (database?.code === "P2002") {
		const target = database.meta?.target;
		const field = Array.isArray(target) ? String(target.at(-1)) : "value";

		return new TRPCError({
			code: "CONFLICT",
			message: `That ${field} is already taken`,
		});
	}

	if (database?.code === "P2025") {
		return new TRPCError({ code: "NOT_FOUND", message: MESSAGES.notFound });
	}

	return null;
}

const friendlyErrors = t.middleware(async ({ next }) => {
	const result = await next();
	if (result.ok) return result;

	const error = toTRPCError(result.error.cause);
	if (error) throw error;

	return result;
});

const requireSession = t.middleware(async ({ ctx, next }) => {
	const session = await currentSession();
	const otherTab =
		ctx.browserSession !== undefined && ctx.browserSession.id !== session?.id;

	if (!session || otherTab) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: MESSAGES.signInRequired,
		});
	}

	return next({ ctx: { userId: session.userId } });
});

export const createCallerFactory = t.createCallerFactory;

export const createTRPCRouter = t.router;

export const publicProcedure = t.procedure.use(friendlyErrors);

export const protectedProcedure = publicProcedure.use(requireSession);
