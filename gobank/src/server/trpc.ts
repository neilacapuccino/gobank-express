import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { env } from "~/env";
import { AppError, asDatabaseError, MESSAGES } from "~/server/errors";
import { currentUserId } from "~/server/session";

export const createTRPCContext = async (opts: { headers: Headers }) => opts;

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    const hidden =
      error.code === "INTERNAL_SERVER_ERROR" && env.NODE_ENV === "production";
    return {
      ...shape,
      message: hidden ? MESSAGES.unexpected : shape.message,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

const toTRPCError = (cause: unknown) => {
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
};

const domainErrors = t.middleware(async ({ next }) => {
  const result = await next();
  const error = result.ok ? null : toTRPCError(result.error.cause);
  if (error) throw error;
  return result;
});

export const createCallerFactory = t.createCallerFactory;

export const createTRPCRouter = t.router;

export const publicProcedure = t.procedure.use(domainErrors);

export const protectedProcedure = publicProcedure.use(async ({ next }) => {
  const userId = await currentUserId();
  if (!userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: MESSAGES.signInRequired,
    });
  }
  return next({ ctx: { userId } });
});
