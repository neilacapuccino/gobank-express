import { expect, test, type Page } from "@playwright/test";

async function signIn(page: Page) {
	await page.goto("/signin");
	await page.getByLabel("Username").fill("maricel");
	await page.getByRole("button", { name: "Continue" }).click();
	await page.keyboard.type("135790");
	await expect(page.getByText("Available balance")).toBeVisible({
		timeout: 60_000,
	});
}

test("welcome screen offers sign-up and log in", async ({ page }) => {
	await page.goto("/");
	await expect(
		page.getByRole("heading", { name: /Send, save and earn/ }),
	).toBeVisible();
	await expect(
		page.getByRole("link", { name: "Create account" }),
	).toBeVisible();
	await expect(page.getByRole("link", { name: "Log in" })).toBeVisible();
});

test("demo user signs in to the dashboard", async ({ page }) => {
	await signIn(page);
	await expect(page.getByText("Recent transactions")).toBeVisible();
});

test("send money blocks amounts above the balance", async ({ page }) => {
	await signIn(page);
	await page.getByRole("link", { name: "Send money" }).click();
	await page.getByLabel("Recipient").fill("@dante");
	await page.getByRole("button", { name: /Dante Reyes/ }).click();
	await page.getByLabel("Amount").fill("9999999");
	await expect(page.locator("#amount-limit")).toHaveText(
		/Maximum|Insufficient balance|daily limit/,
	);
	await expect(page.getByRole("button", { name: "Review" })).toBeDisabled();
});
