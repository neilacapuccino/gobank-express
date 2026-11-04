import "dotenv/config";
import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { PrismaClient } from "../generated/prisma/index.js";
import { hashPin } from "../src/features/auth/pin";
import { newAccountNumber } from "../src/server/identifiers";

const PIN = "246802";

test("Overview closes a GoalSave after confirmation and returns its savings", async ({
	page,
}) => {
	test.setTimeout(180_000);
	const db = new PrismaClient();
	const suffix = randomUUID().replaceAll("-", "").slice(0, 10);
	const username = `close_${suffix}`;
	const goalName = `Close fixture ${suffix}`;
	let userId: string | undefined;

	try {
		const user = await db.user.create({
			data: {
				username,
				fullName: "Close GoalSave test",
				accountNumber: newAccountNumber(),
				pinHash: await hashPin(PIN),
				balance: 10_000,
				savingsGoals: {
					create: {
						name: goalName,
						balance: 5_000,
						targetAmount: 50_000,
						interestCalculatedAt: new Date(),
					},
				},
			},
			include: { savingsGoals: true },
		});
		userId = user.id;
		const goal = user.savingsGoals[0]!;
		const historicalTransfer = await db.transaction.create({
			data: {
				userId,
				savingsGoalId: goal.id,
				reference: `close_${randomUUID()}`,
				kind: "stash",
				title: "Transfer to closing goal fixture",
				amount: -5_000,
				balanceAfter: 10_000,
			},
		});

		await page.goto("/signin");
		await page.getByLabel("Username").fill(username);
		await page.getByRole("button", { name: "Continue", exact: true }).click();
		await expect(
			page.getByRole("heading", { name: "Enter your PIN" }),
		).toBeVisible();
		await page.keyboard.type(PIN);
		await expect(
			page.getByText("Available balance", { exact: true }),
		).toBeVisible({ timeout: 60_000 });

		await page.getByRole("link", { name: /^GoalSave/ }).click();
		await page.getByRole("link", { name: new RegExp(goalName) }).click();
		await expect(
			page.getByRole("heading", { name: goalName, exact: true }),
		).toBeVisible();

		const close = page.getByRole("button", {
			name: "Close this GoalSave",
			exact: true,
		});
		await expect(page.getByRole("tab", { name: "Overview" })).toHaveAttribute(
			"aria-selected",
			"true",
		);
		await expect(close).toBeVisible();
		await page.getByRole("tab", { name: "Transactions" }).click();
		await expect(close).not.toBeVisible();
		await page.getByRole("tab", { name: "Overview" }).click();
		await expect(close).toBeVisible();

		await page.getByRole("button", { name: "Settings", exact: true }).click();
		await expect(
			page.getByRole("heading", { name: "Goal settings", exact: true }),
		).toBeVisible();
		await expect(
			page.getByRole("button", { name: "Close goal", exact: true }),
		).toHaveCount(0);
		await page.getByRole("button", { name: "Cancel", exact: true }).click();

		await close.click();
		const confirmation = page.getByRole("region", {
			name: "Close GoalSave confirmation",
			exact: true,
		});
		await expect(confirmation).toBeVisible();
		await expect(confirmation).toContainText(
			"₱50.00 will return to your main account",
		);
		await confirmation
			.getByRole("button", { name: "Keep GoalSave", exact: true })
			.click();
		await expect(confirmation).not.toBeVisible();
		expect(
			await db.savingsGoal.findUnique({ where: { id: goal.id } }),
		).not.toBeNull();
		expect(
			(await db.user.findUniqueOrThrow({ where: { id: userId } })).balance,
		).toBe(10_000);

		await close.click();
		await confirmation
			.getByRole("button", { name: "Close and return savings", exact: true })
			.click();
		await expect(page).toHaveURL(/\/goals$/);
		await expect(
			page.getByRole("heading", { name: "GoalSave", exact: true }),
		).toBeVisible();
		await expect(
			page.getByRole("link", { name: new RegExp(goalName) }),
		).toHaveCount(0);
		expect(
			await db.savingsGoal.findUnique({ where: { id: goal.id } }),
		).toBeNull();
		expect(
			(await db.user.findUniqueOrThrow({ where: { id: userId } })).balance,
		).toBe(15_000);
		expect(
			await db.transaction.findUniqueOrThrow({
				where: { id: historicalTransfer.id },
			}),
		).toEqual({ ...historicalTransfer, savingsGoalId: null });
		expect(await db.transaction.count({ where: { userId } })).toBe(2);
	} finally {
		try {
			if (userId) await db.user.deleteMany({ where: { id: userId } });
		} finally {
			await db.$disconnect();
		}
	}
});
