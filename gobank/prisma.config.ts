import { config } from "dotenv";
import { defineConfig } from "prisma/config";

config({ quiet: true });

export default defineConfig({
	migrations: {
		seed: "node --conditions=react-server --import tsx prisma/seed.ts",
	},
});
