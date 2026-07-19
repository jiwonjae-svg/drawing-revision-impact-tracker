import { mkdir } from "node:fs/promises";
import { chromium, type Page } from "@playwright/test";

const baseUrl = process.env.DEMO_BASE_URL ?? "http://localhost:3200";
const outputDir = "docs/screenshots";

async function signInAs(page: Page, role: "Designer" | "Admin") {
  console.log(`Opening login as ${role}...`);
  await page.goto(`${baseUrl}/login`);
  await page.screenshot({ path: `${outputDir}/00-login.png`, fullPage: true });
  await page.getByRole("button", { name: new RegExp(`^${role}`) }).click();
  try {
    await page.waitForURL(/\/dashboard$/);
  } catch (error) {
    await page.screenshot({ path: `${outputDir}/00-login-error.png`, fullPage: true });
    throw error;
  }
  console.log(`Signed in as ${role}.`);
}

async function main() {
  await mkdir(outputDir, { recursive: true });
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    deviceScaleFactor: 1,
    colorScheme: "light",
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  page.setDefaultTimeout(20_000);
  page.on("console", (message) => console.log(`[browser:${message.type()}] ${message.text()}`));
  page.on("pageerror", (error) => console.error(`[browser:error] ${error.message}`));
  page.on("response", (response) => {
    if (response.url().includes("/api/auth/")) console.log(`[auth] ${response.status()} ${response.url()}`);
  });

  try {
    await signInAs(page, "Designer");
    await page.getByRole("heading", { name: "Revision control overview" }).waitFor();
    await page.screenshot({ path: `${outputDir}/01-dashboard.png`, fullPage: true });

    await page.getByRole("link", { name: "Drawing register" }).click();
    await page.waitForURL(/\/drawings$/);
    await page.getByRole("heading", { name: "Drawing register" }).waitFor();
    await page.screenshot({ path: `${outputDir}/02-drawing-register.png`, fullPage: true });

    await page.locator('a[href^="/drawings/"]').first().click();
    await page.getByRole("heading", { name: "Revision history" }).waitFor();
    await page.locator('tbody a[href^="/revisions/"]').first().click();
    await page.waitForURL(/\/revisions\/.+/);
    await page.getByRole("heading", { name: "Change and impact definition" }).waitFor();
    await page.screenshot({ path: `${outputDir}/03-revision-evidence.png`, fullPage: true });

    await page.getByRole("button", { name: "Sign out" }).first().click();
    await page.waitForURL(/\/login$/);
    await signInAs(page, "Admin");
    await page.getByRole("link", { name: "Integrations" }).click();
    await page.waitForURL(/\/integrations$/);
    await page.getByRole("heading", { name: "Integrations & notifications" }).waitFor();
    await page.screenshot({ path: `${outputDir}/04-integrations.png`, fullPage: true });

    await page.getByRole("link", { name: "Audit trail" }).click();
    await page.waitForURL(/\/audit$/);
    await page.getByRole("heading", { name: "Audit trail" }).waitFor();
    await page.screenshot({ path: `${outputDir}/05-audit-trail.png`, fullPage: true });
    console.log(`Captured DrawingFlow evidence from ${baseUrl}.`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
