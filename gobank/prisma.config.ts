import { config } from "dotenv";
import { defineConfig } from "prisma/config";

config({ quiet: true });

export default defineConfig({
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
