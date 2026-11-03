import { expect, test, type Page } from "@playwright/test";

const DEMO_USERNAME = "maricel";
const DEMO_PIN = "135790";

async function signIn(page: Page) {
	await page.goto("/signin");

	await page.getByLabel("Username").fill(DEMO_USERNAME);
	await page.getByRole("button", { name: "Continue" }).click();
	await page.keyboard.type(DEMO_PIN);

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
	const continueButton = page.getByRole("button", { name: "Continue" });
	await expect(continueButton).toBeEnabled({ timeout: 15_000 });
	await continueButton.click();
	await page.getByLabel("Amount").fill("9999999");

	await expect(page.locator("#amount-limit")).toHaveText(
		/Maximum|Insufficient balance|daily limit/,
	);
	await expect(page.getByRole("button", { name: "Review" })).toBeDisabled();
});
