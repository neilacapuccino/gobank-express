import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
	server: {
		DATABASE_URL: z.string().url(),
		CARD_ENCRYPTION_KEY: z
			.string()
			.regex(/^[a-f0-9]{64}$/i)
			.optional(),
		NODE_ENV: z
			.enum(["development", "test", "production"])
			.default("development"),
		GOOGLE_CLIENT_ID: z.string().min(1).optional(),
		GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
		AUTH_SECRET: z.string().min(32).optional(),
	},

	client: {},

	runtimeEnv: {
		DATABASE_URL: process.env.DATABASE_URL,
		CARD_ENCRYPTION_KEY: process.env.CARD_ENCRYPTION_KEY,
		NODE_ENV: process.env.NODE_ENV,
		GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
		GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
		AUTH_SECRET: process.env.AUTH_SECRET,
	},
	skipValidation: !!process.env.SKIP_ENV_VALIDATION,
	emptyStringAsUndefined: true,
});
