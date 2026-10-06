import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { createServer } from "node:net";
import { fileURLToPath } from "node:url";

const appRoot = fileURLToPath(new URL("../", import.meta.url));
const clientRoot = new URL("../generated/prisma/", import.meta.url);

async function checkPort() {
	await new Promise<void>((resolve, reject) => {
		const server = createServer();
		server.once("error", reject);
		server.listen(3001, () => {
			server.close((error) => (error ? reject(error) : resolve()));
		});
	});
}

function clientIsCurrent() {
	const files = ["index.js", "index.d.ts", "schema.prisma"];
	if (!files.every((file) => existsSync(new URL(file, clientRoot)))) {
		return false;
	}
	const hasEngine = readdirSync(clientRoot).some(
		(file) => file.includes("query_engine") && file.endsWith(".node"),
	);
	if (!hasEngine) return false;

	const schema = (url: URL) =>
		readFileSync(url, "utf8").replaceAll("\r\n", "\n").trim();
	return (
		schema(new URL("../prisma/schema.prisma", import.meta.url)) ===
		schema(new URL("schema.prisma", clientRoot))
	);
}

async function prepareDev() {
	try {
		await checkPort();
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === "EADDRINUSE") {
			console.error(
				"Port 3001 is already in use. If GoBank is running, open http://localhost:3001. Stop the existing server before restarting.",
			);
			process.exitCode = 1;
			return;
		}
		throw error;
	}

	if (clientIsCurrent()) {
		console.log("Prisma client is current; starting without regeneration.");
		return;
	}

	const require = createRequire(import.meta.url);
	const result = spawnSync(
		process.execPath,
		[require.resolve("prisma/build/index.js"), "generate"],
		{ cwd: appRoot, stdio: "inherit" },
	);
	if (result.error) throw result.error;
	process.exitCode = result.status ?? 1;
}

prepareDev().catch((error: unknown) => {
	console.error(error);
	process.exitCode = 1;
});
