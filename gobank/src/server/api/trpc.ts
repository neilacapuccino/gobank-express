import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { env } from "~/env";
import { currentUserId } from "~/server/auth/session";
import { db } from "~/server/db";
import { Prisma } from "../../../generated/prisma";

export const createTRPCContext = async (opts: { headers: Headers }) => ({
  db,
  ...opts,
});

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    const hidden =
      error.code === "INTERNAL_SERVER_ERROR" && env.NODE_ENV === "production";
    return {
      ...shape,
      message: hidden
        ? "Something went wrong. Please try again."
        : shape.message,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createCallerFactory = t.createCallerFactory;

export const createTRPCRouter = t.router;

const friendlyDatabaseErrors = t.middleware(async ({ next }) => {
  const result = await next();
  const cause = result.ok ? null : result.error.cause;

  if (cause instanceof Prisma.PrismaClientKnownRequestError) {
    if (cause.code === "P2002") {
      const target = cause.meta?.target;
      const field = Array.isArray(target) ? String(target.at(-1)) : "value";
      throw new TRPCError({
        code: "CONFLICT",
        message: `That ${field} is already taken`,
      });
    }
    if (cause.code === "P2025") {
      throw new TRPCError({ code: "NOT_FOUND", message: "Not found" });
    }
  }
  return result;
});

export const publicProcedure = t.procedure.use(friendlyDatabaseErrors);

export const protectedProcedure = publicProcedure.use(async ({ next }) => {
  const userId = await currentUserId();
  if (!userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Sign in to continue",
    });
  }
  return next({ ctx: { userId } });
});
