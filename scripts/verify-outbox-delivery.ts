import { chromium, expect, type Page } from "@playwright/test";

const baseUrl = process.env.DEMO_BASE_URL ?? "https://drawing-revision-impact-tracker.vercel.app";

async function signInAs(page: Page, role: "Designer" | "Admin") {
  await page.goto(`${baseUrl}/login`);
  await page.getByRole("button", { name: new RegExp(`^${role}`) }).click();
  await page.waitForURL(/\/dashboard$/);
}

async function main() {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
  const page = await context.newPage();
  page.setDefaultTimeout(30_000);

  try {
    await signInAs(page, "Designer");
    await page.getByRole("link", { name: "Create revision" }).click();
    await page.locator("#drawingId").selectOption({ index: 1 });
    await page.locator("#revisionCode").fill(`V${String(Date.now()).slice(-6)}`);
    await page.locator("#summary").fill("Synthetic production verification for signed webhook delivery.");
    await page.locator("#reason").fill("Verify that a committed workflow event reaches the secured demo receiver.");
    await page.locator("#effectiveDate").fill("2026-07-26");
    await page.locator("#dueDate").fill("2026-07-27");
    await page.locator("#impactTarget-0").fill("Webhook delivery evidence");
    await page.locator("#impactDescription-0").fill("Confirm the durable outbox event is marked sent only after a 204 response.");
    await page.getByRole("button", { name: "Create draft revision" }).click();
    await page.waitForURL(/\/revisions\/.+/);
    await page.getByRole("button", { name: "Submit for independent review" }).click();
    await page.getByText("In review", { exact: true }).waitFor({ timeout: 30_000 });

    await page.getByRole("button", { name: "Sign out" }).first().click();
    await page.waitForURL(/\/login$/);
    await signInAs(page, "Admin");
    await page.getByRole("link", { name: "Integrations" }).click();
    await page.getByRole("heading", { name: "Integrations & notifications" }).waitFor();
    await expect(page.getByText("Webhook: configured", { exact: false })).toBeVisible();

    const sentCount = Number(await page.getByText("Sent", { exact: true }).locator("..").locator("dd").textContent());
    if (!Number.isFinite(sentCount) || sentCount < 2) {
      throw new Error(`Expected at least two sent events, received ${sentCount}.`);
    }

    await page.screenshot({ path: "docs/screenshots/04-integrations.png", fullPage: true });
    console.log(`Production outbox verified: ${sentCount} signed webhook events are SENT.`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Production outbox verification failed.");
  process.exitCode = 1;
});
