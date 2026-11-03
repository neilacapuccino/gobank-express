import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "e2e",
	timeout: 90_000,
	use: {
		...devices["Pixel 7"],
		baseURL: "http://localhost:3001",
		channel: "chrome",
	},
	webServer: {
		command: "npm run dev",
		url: "http://localhost:3001",
		reuseExistingServer: true,
		timeout: 120_000,
	},
});
