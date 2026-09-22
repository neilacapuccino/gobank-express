import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const derive = promisify(scrypt) as (
  pin: string,
  salt: string,
  length: number,
) => Promise<Buffer>;

export async function hashPin(pin: string) {
  const salt = randomBytes(16).toString("hex");
  const key = await derive(pin, salt, 64);
  return `${salt}:${key.toString("hex")}`;
}

export async function verifyPin(pin: string, stored: string) {
  const [salt = "", hash = ""] = stored.split(":");
  const key = await derive(pin, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return expected.length === key.length && timingSafeEqual(key, expected);
}
