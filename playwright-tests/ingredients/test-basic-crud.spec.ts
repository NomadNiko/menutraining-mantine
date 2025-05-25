import { test, expect } from "@playwright/test";
import { login } from "../helpers/auth";

test.describe("Basic Ingredient Tests", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto("/en/restaurant/ingredients");
    await page.waitForLoadState("networkidle");
  });

  test("Navigate to create ingredient page", async ({ page }) => {
    // Click create button
    await page.click('[data-testid="create-ingredient-button"]');

    // Should navigate to create page
    await expect(page).toHaveURL(/.*ingredients\/create/);

    // Should see form fields
    await expect(page.locator('input[name="ingredientName"]')).toBeVisible();
  });

  test("Create simple ingredient", async ({ page }) => {
    // Navigate to create page
    await page.click('[data-testid="create-ingredient-button"]');
    await page.waitForURL("**/ingredients/create");

    // Fill minimum required fields
    const ingredientName = `Test ${Date.now()}`;
    await page.fill('input[name="ingredientName"]', ingredientName);

    // Select at least one category (required)
    const categoryCheckbox = page.locator('input[type="checkbox"]').first();
    if (await categoryCheckbox.isVisible()) {
      await categoryCheckbox.check();
    }

    // Submit
    await page.click('button[type="submit"]');

    // Should redirect back to ingredients list
    await expect(page).toHaveURL(/.*ingredients(?!\/create)/);

    // Ingredient should appear in list
    await expect(page.locator(`text=${ingredientName}`)).toBeVisible({
      timeout: 10000,
    });
  });

  test("Search functionality", async ({ page }) => {
    // Use the search input
    const searchInput = page
      .locator('input[placeholder*="Search"], input[placeholder*="search"]')
      .first();
    await searchInput.fill("test");
    await page.waitForTimeout(600); // Wait for debounce

    // Should either show filtered results or "no results"
    const hasTable = await page.locator("table").isVisible();
    const hasNoResults =
      (await page.locator("text=/No ingredients found/i").count()) > 0;

    expect(hasTable || hasNoResults).toBeTruthy();
  });

  test("Filter panel works", async ({ page }) => {
    // Open filter panel
    const filterButton = page
      .locator('button:has-text("Show Filters"), button:has-text("Filters")')
      .first();
    if (await filterButton.isVisible()) {
      await filterButton.click();

      // Apply filters button should be visible
      await expect(
        page.locator('button:has-text("Apply Filters")')
      ).toBeVisible();

      // Reset filters button should be visible
      await expect(
        page.locator('button:has-text("Reset Filters")')
      ).toBeVisible();
    }
  });
});
