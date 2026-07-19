import { expect, test, type Page } from "@playwright/test";

async function signInAs(page: Page, role: "Designer" | "Reviewer" | "Production" | "Viewer") {
  await page.goto("/login");
  await page.getByRole("button", { name: new RegExp(`^${role}`) }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

async function signOut(page: Page) {
  await page.getByRole("button", { name: "Sign out" }).first().click();
  await expect(page).toHaveURL(/\/login$/);
}

test("designer, reviewer, and production complete a controlled revision", async ({ page }) => {
  const revisionCode = `T${String(Date.now()).slice(-6)}`;
  await signInAs(page, "Designer");
  await page.getByRole("link", { name: "Create revision" }).click();
  await page.locator("#drawingId").selectOption({ index: 1 });
  await page.locator("#revisionCode").fill(revisionCode);
  await page.locator("#summary").fill("Test access bracket moved to protect welding clearance.");
  await page.locator("#reason").fill("Interface review found insufficient access for the planned weld sequence.");
  await page.locator("#effectiveDate").fill("2026-07-22");
  await page.locator("#dueDate").fill("2026-07-23");
  await page.locator("#impactTarget-0").fill("Welding");
  await page.locator("#impactDescription-0").fill("Verify the weld sequence and access before release.");
  await page.getByRole("button", { name: "Create draft revision" }).click();
  await expect(page).toHaveURL(/\/revisions\/(?!new$).+/);
  const revisionUrl = page.url();
  await page.getByRole("button", { name: "Submit for independent review" }).click();
  await expect(page.getByText("In review", { exact: true })).toBeVisible();

  await signOut(page);
  await signInAs(page, "Reviewer");
  await page.goto(revisionUrl);
  await page.locator("#approve-comment").fill("Geometry, impact evidence, and downstream controls verified.");
  await page.getByRole("button", { name: "Approve revision" }).click();
  await expect(page.getByText("Approved", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Issue controlled revision" }).click();
  await expect(page.getByText("Issued", { exact: true })).toBeVisible();

  await signOut(page);
  await signInAs(page, "Production");
  await page.goto(revisionUrl);
  await page.locator("#ack-note").fill("Issued revision received and work package hold point confirmed.");
  await page.getByRole("button", { name: "Record acknowledgement" }).click();
  await expect(page.getByText("Field acknowledgement recorded.")).toBeVisible();
  await page.getByRole("button", { name: "Close revision control" }).click();
  await expect(page.getByText("Closed", { exact: true })).toBeVisible();
});

test("dashboard and register are operational", async ({ page }) => {
  await signInAs(page, "Designer");
  await expect(page.getByRole("heading", { name: "Revision control overview" })).toBeVisible();
  await page.screenshot({ path: "artifacts/drawingflow-dashboard-desktop.png", fullPage: true });
  await page.getByRole("link", { name: "Drawing register" }).click();
  await expect(page.getByRole("heading", { name: "Drawing register" })).toBeVisible();
  await expect(page.getByText("DEMO-", { exact: false }).first()).toBeVisible();
});

test("project access and CSV integration stay inside the synthetic boundary", async ({ page }) => {
  await signInAs(page, "Viewer");
  await expect(page.getByText("Aurora Ro-Ro Vessel", { exact: true })).toBeVisible();
  await expect(page.getByText("Horizon Offshore Support", { exact: true })).toHaveCount(0);
  await signOut(page);

  await signInAs(page, "Designer");
  await page.getByRole("link", { name: "Integrations" }).click();
  await expect(page.getByRole("heading", { name: "Integrations & notifications" })).toBeVisible();
  await page.locator("#projectId").selectOption("project-aurora");
  await page.locator("#drawingRegister").setInputFiles({
    name: "synthetic-register.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(
      "number,title,block,zone,discipline,status\nDEMO-AUR-B101-STR-999,Synthetic E2E insert,B101,PORT,STRUCTURE,ACTIVE",
    ),
  });
  await page.getByRole("button", { name: "Validate and import" }).click();
  await expect(page.getByText("Imported 1 synthetic drawing row(s).", { exact: true })).toBeVisible();
  await expect(page.getByText("synthetic-register.csv", { exact: true })).toBeVisible();
});
