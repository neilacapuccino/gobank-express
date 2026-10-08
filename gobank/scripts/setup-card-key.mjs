import { randomBytes } from "node:crypto";
import { appendFile, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const appDirectory = fileURLToPath(new URL("../", import.meta.url));
const environmentFile = new URL("../.env", import.meta.url);
const existing = await readFile(environmentFile, "utf8").catch((error) => {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    error.code === "ENOENT"
  )
    return "";
  throw error;
});
if (
  process.env.CARD_ENCRYPTION_KEY ||
  /^\s*(?:export\s+)?CARD_ENCRYPTION_KEY\s*=/m.test(existing)
) {
  console.log("CARD_ENCRYPTION_KEY already exists; no changes made.");
} else {
  const ignored = spawnSync("git", ["check-ignore", "--quiet", ".env"], {
    cwd: appDirectory,
  });
  if (ignored.status !== 0)
    throw new Error(
      "Keep .env ignored by Git before configuring card encryption.",
    );
  const prefix = existing.length && !existing.endsWith("\n") ? "\n" : "";
  await appendFile(
    environmentFile,
    `${prefix}CARD_ENCRYPTION_KEY="${randomBytes(32).toString("hex")}"\n`,
    { mode: 0o600 },
  );
  console.log(
    "Card encryption configured locally. Reuse the same private key for every app sharing this database.",
  );
}
