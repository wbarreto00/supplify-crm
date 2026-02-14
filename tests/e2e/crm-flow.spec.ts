import { expect, test } from "@playwright/test";

test("login -> criar company -> criar deal -> validar detalhes", async ({ page }) => {
  const unique = Date.now().toString();
  const companyName = `Company E2E ${unique}`;
  const dealTitle = `Deal E2E ${unique}`;

  await page.goto("/login");
  await page.getByLabel("Senha de administrador").fill(process.env.ADMIN_PASSWORD ?? "admin123");
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page).toHaveURL(/\/dashboard/);

  await page.getByRole("link", { name: "Companies" }).click();
  await expect(page).toHaveURL(/\/companies/);

  await page.locator('input[name="name"]').first().fill(companyName);
  await page.locator('input[name="segment"]').first().fill("SaaS");
  await page.locator('input[name="owner"]').first().fill("E2E Bot");
  await page.getByRole("button", { name: "Criar company" }).click();

  await page.getByRole("link", { name: companyName }).click();
  await expect(page).toHaveURL(/\/companies\//);

  await page.locator('a[href*="tab=deals"]').click();
  await expect(page).toHaveURL(/tab=deals/);

  await page.locator('input[name="title"]').first().fill(dealTitle);
  await page.locator('input[name="value"]').first().fill("5000");
  await page.locator('input[name="probability"]').first().fill("70");
  await page.getByRole("button", { name: "Criar deal" }).click();

  await expect(page.getByText(dealTitle)).toBeVisible();
});
