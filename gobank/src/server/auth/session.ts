import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { cache } from "react";
import { env } from "~/env";
import { db } from "~/server/db";

const COOKIE = "gb_session";
const MAX_AGE = 60 * 60 * 24 * 30;

const hash = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export async function startSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  await db.session.create({
    data: {
      id: hash(token),
      userId,
      expiresAt: new Date(Date.now() + MAX_AGE * 1000),
    },
  });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export const currentUserId = cache(async () => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({ where: { id: hash(token) } });
  if (!session || session.expiresAt < new Date()) return null;
  return session.userId;
});

export async function endSession() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { id: hash(token) } });
  store.delete(COOKIE);
}
