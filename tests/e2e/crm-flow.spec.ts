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

  await page.getByRole("link", { name: "+ Company" }).click();
  await expect(page).toHaveURL(/\/companies\/new/);

  await page.locator('input[name="name"]').fill(companyName);
  await page.locator('input[name="segment"]').fill("SaaS");
  await page.locator('input[name="owner"]').fill("E2E Bot");
  await page.getByRole("button", { name: "Criar company" }).click();

  await expect(page).toHaveURL(/\/companies/);
  await page.getByRole("link", { name: companyName }).click();
  await expect(page).toHaveURL(/\/companies\//);

  await page.locator('a[href*="tab=deals"]').click();
  await expect(page).toHaveURL(/tab=deals/);

  await page.getByRole("link", { name: "+ Deal" }).click();
  await expect(page).toHaveURL(/\/deals\/new/);

  await page.locator('input[name="title"]').fill(dealTitle);
  await page.locator('input[name="value"]').fill("5000");
  await page.locator('input[name="probability"]').fill("70");
  await page.getByRole("button", { name: "Criar deal" }).click();

  await expect(page.getByText(dealTitle)).toBeVisible();
});
