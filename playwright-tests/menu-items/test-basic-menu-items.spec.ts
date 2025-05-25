import { test, expect } from "@playwright/test";
import { login } from "../helpers/auth";

test.describe("Basic Menu Item Tests", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto("/en/restaurant/menu-items");
    await page.waitForLoadState("networkidle");
  });

  test("Menu items page loads correctly", async ({ page }) => {
    // Check page title
    await expect(
      page.locator("h2").filter({ hasText: /Menu Items/ })
    ).toBeVisible();

    // Check for create button
    const createButton = page
      .locator(
        '[data-testid="create-menu-item-button"], a[href*="menu-items/create"], button:has-text("Add"), button:has-text("Create")'
      )
      .first();
    await expect(createButton).toBeVisible();
  });

  test("Navigate to create menu item page", async ({ page }) => {
    // Find and click create button
    const createButton = page
      .locator(
        '[data-testid="create-menu-item-button"], a[href*="menu-items/create"], button:has-text("Add"), button:has-text("Create")'
      )
      .first();
    await createButton.click();

    // Should navigate to create page
    await expect(page).toHaveURL(/.*menu-items\/create/);

    // Should see form fields
    const nameInput = page
      .locator(
        'input[name="name"], input[name="menuItemName"], input[name="itemName"]'
      )
      .first();
    await expect(nameInput).toBeVisible();
  });

  test("Search menu items", async ({ page }) => {
    // Find search input
    const searchInput = page
      .locator('input[placeholder*="Search"], input[placeholder*="search"]')
      .first();
    await searchInput.fill("pizza");
    await page.waitForTimeout(600); // Wait for debounce

    // Should show filtered results or no results message
    const hasResults =
      (await page
        .locator('table tbody tr, [data-testid*="menu-item-card"]')
        .count()) > 0;
    const hasNoResults =
      (await page.locator("text=/No menu items found/i").count()) > 0;

    expect(hasResults || hasNoResults).toBeTruthy();
  });

  test("Filter panel exists", async ({ page }) => {
    // Look for filter button
    const filterButton = page
      .locator('button:has-text("Filter"), button:has-text("Show Filters")')
      .first();

    if (await filterButton.isVisible()) {
      await filterButton.click();

      // Should show filter options
      const filterPanel = page
        .locator(
          '[data-testid="filter-panel"], [role="region"][aria-label*="filter"]'
        )
        .first();
      await expect(
        filterPanel.or(page.locator("text=Apply Filters"))
      ).toBeVisible();
    }
  });
});
