import { readFileSync } from "node:fs";

const schema = (path) =>
  readFileSync(new URL(path, import.meta.url), "utf8")
    .replaceAll("\r\n", "\n")
    .trim();
if (
  schema("../prisma/schema.prisma") !==
  schema("../generated/prisma/schema.prisma")
) {
  throw new Error(
    "Prisma client is stale. Stop the dev server and run npx prisma generate before pushing.",
  );
}
console.log("Prisma client matches the current schema.");
