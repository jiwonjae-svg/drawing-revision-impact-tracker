import { expect, test } from "@playwright/test";

test("mobile login and dashboard stay usable", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /^Viewer/ }).click();
  await expect(page.getByRole("heading", { name: "Revision control overview" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open navigation" })).toBeVisible();
  await page.screenshot({ path: "artifacts/drawingflow-dashboard-mobile.png", fullPage: true });
});

