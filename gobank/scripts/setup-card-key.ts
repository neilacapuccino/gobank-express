import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { appendFile, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const appDirectory = fileURLToPath(new URL("../", import.meta.url));
const environmentFile = new URL("../.env", import.meta.url);

const KEY_LINE = /^\s*(?:export\s+)?CARD_ENCRYPTION_KEY\s*=/m;

const isMissingFile = (error: unknown) =>
	typeof error === "object" &&
	error !== null &&
	"code" in error &&
	error.code === "ENOENT";

async function readEnvironmentFile() {
	try {
		return await readFile(environmentFile, "utf8");
	} catch (error) {
		if (isMissingFile(error)) return "";
		throw error;
	}
}

function envFileIsIgnoredByGit() {
	const result = spawnSync("git", ["check-ignore", "--quiet", ".env"], {
		cwd: appDirectory,
	});

	return result.status === 0;
}

const existing = await readEnvironmentFile();
const keyAlreadySet =
	Boolean(process.env.CARD_ENCRYPTION_KEY) || KEY_LINE.test(existing);

if (keyAlreadySet) {
	console.log("CARD_ENCRYPTION_KEY already exists; no changes made.");
} else {
	if (!envFileIsIgnoredByGit()) {
		throw new Error(
			"Keep .env ignored by Git before configuring card encryption.",
		);
	}

	const newKey = randomBytes(32).toString("hex");
	const startsOnNewLine = existing.length > 0 && !existing.endsWith("\n");

	await appendFile(
		environmentFile,
		`${startsOnNewLine ? "\n" : ""}CARD_ENCRYPTION_KEY="${newKey}"\n`,
		{ mode: 0o600 },
	);

	console.log(
		"Card encryption configured locally. Reuse the same private key for every app sharing this database.",
	);
}
