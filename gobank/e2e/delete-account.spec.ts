import "dotenv/config";
import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { PrismaClient } from "../generated/prisma/index.js";
import { hashPin } from "../src/features/auth/pin";
import { newAccountNumber } from "../src/server/identifiers";

const PIN = "246802";

test("account deletion confirms ownership, removes database records and signs out", async ({
	page,
	request,
}) => {
	test.setTimeout(180_000);
	const db = new PrismaClient();
	const username = `delete_${randomUUID().replaceAll("-", "").slice(0, 10)}`;
	let userId: string | undefined;

	try {
		const user = await db.user.create({
			data: {
				username,
				fullName: "Account deletion test",
				accountNumber: newAccountNumber(),
				pinHash: await hashPin(PIN),
			},
			select: { id: true },
		});
		userId = user.id;

		const anonymous = await request.post("/api/trpc/account.deleteAccount", {
			data: { json: { pin: PIN, userId } },
		});
		expect(anonymous.status()).toBe(401);
		expect(await db.user.findUnique({ where: { id: userId } })).not.toBeNull();

		await page.goto("/signin");
		await page.getByLabel("Username").fill(username);
		await page.getByRole("button", { name: "Continue", exact: true }).click();
		await expect(
			page.getByRole("heading", { name: "Enter your PIN" }),
		).toBeVisible();
		await page.keyboard.type(PIN);
		await expect(
			page.getByText("Available balance", { exact: true }),
		).toBeVisible({
			timeout: 60_000,
		});

		await page.getByRole("link", { name: "Profile and settings" }).click();
		await page
			.getByRole("link", { name: "Account settings", exact: true })
			.click();
		await expect(
			page.getByRole("heading", { name: "Account settings", exact: true }),
		).toBeVisible();

		await page
			.getByRole("button", { name: "Delete account", exact: true })
			.click();
		const pin = page.getByLabel("Current PIN", { exact: true });
		const confirm = page
			.getByRole("form", { name: "Delete your account?", exact: true })
			.getByRole("button", { name: "Delete account", exact: true });
		await expect(pin).toHaveAttribute("type", "password");
		await expect(confirm).toBeDisabled();
		await expect(
			page.getByRole("button", { name: "Save changes", exact: true }),
		).toBeDisabled();
		await page.getByRole("button", { name: "Cancel", exact: true }).click();
		await expect(pin).not.toBeVisible();
		expect(await db.user.findUnique({ where: { id: userId } })).not.toBeNull();
		await expect(
			page.getByRole("button", { name: "Save changes", exact: true }),
		).toBeEnabled();

		await page
			.getByRole("button", { name: "Delete account", exact: true })
			.click();
		await pin.fill("000000");
		await confirm.click();
		await expect(
			page.getByText("That PIN is not right", { exact: true }),
		).toBeVisible();
		expect(await db.user.findUnique({ where: { id: userId } })).not.toBeNull();
		expect(await db.session.count({ where: { userId } })).toBeGreaterThan(0);

		await pin.fill(PIN);
		await confirm.click();
		await expect(page).toHaveURL(/\/signin$/);
		await expect(page.getByLabel("Username")).toBeVisible();
		expect(await db.user.findUnique({ where: { id: userId } })).toBeNull();
		expect(await db.session.count({ where: { userId } })).toBe(0);
		expect(
			(await page.context().cookies()).some(
				(cookie) => cookie.name === "gb_session",
			),
		).toBe(false);

		await page.goto("/settings/profile");
		await expect(page).toHaveURL(/\/signin$/);
		await page.getByLabel("Username").fill(username);
		await page.getByRole("button", { name: "Continue", exact: true }).click();
		await expect(
			page.getByRole("heading", { name: "Enter your PIN" }),
		).toBeVisible();
		await page.keyboard.type(PIN);
		await expect(
			page.getByText("Wrong username or PIN", { exact: true }),
		).toBeVisible();
		expect(await db.session.count({ where: { userId } })).toBe(0);
	} finally {
		if (userId) await db.user.deleteMany({ where: { id: userId } });
		await db.$disconnect();
	}
});
