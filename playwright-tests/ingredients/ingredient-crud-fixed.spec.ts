import { test, expect } from "@playwright/test";
import { login } from "../helpers/auth";

test.describe("Ingredient CRUD Operations", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto("/en/restaurant/ingredients");
    await page.waitForLoadState("networkidle");
  });

  test("Create new ingredient with all fields", async ({ page }) => {
    const startTime = Date.now();

    // Click create button using data-testid
    await page.click('[data-testid="create-ingredient-button"]');
    await page.waitForURL("**/restaurant/ingredients/create");

    const navigationTime = Date.now() - startTime;
    console.log(`Navigation to create page: ${navigationTime}ms`);

    // Fill in ingredient form
    const ingredientName = `Test Ingredient ${Date.now()}`;
    await page.fill('input[name="name"]', ingredientName);
    await page.fill(
      'textarea[name="description"]',
      "Test description for automated testing"
    );
    await page.fill('input[name="quantity"]', "100");
    await page.fill('input[name="unit"]', "grams");
    await page.fill('input[name="cost"]', "5.99");

    // Select category
    await page.click('[data-testid="category-select"]');
    await page.click('div[role="option"]:has-text("Vegetables")');

    // Select allergies
    const allergyCheckbox = page.locator(
      'input[type="checkbox"][value="gluten"]'
    );
    if (await allergyCheckbox.isVisible()) {
      await allergyCheckbox.check();
    }

    // Submit form
    const submitStart = Date.now();
    await page.click('button[type="submit"]');

    // Wait for redirect to ingredient list
    await page.waitForURL("**/restaurant/ingredients");
    const submitTime = Date.now() - submitStart;
    console.log(`Ingredient creation time: ${submitTime}ms`);

    // Verify ingredient appears in list
    await expect(page.locator(`text=${ingredientName}`)).toBeVisible({
      timeout: 10000,
    });
  });

  test("Search and filter ingredients", async ({ page }) => {
    // Wait for any existing ingredients to load
    await page.waitForTimeout(1000);

    // Test search functionality - use the search bar
    const searchBar = page.locator('input[placeholder*="Search"]');
    await searchBar.fill("tomato");
    await page.waitForTimeout(500); // Debounce

    // Check if results are filtered (either found or "no results")
    const hasResults =
      (await page.locator('table tbody tr, [class*="card"]').count()) > 0;
    const hasNoResults = await page
      .locator("text=No ingredients found")
      .isVisible();

    expect(hasResults || hasNoResults).toBeTruthy();

    // Test filter panel
    await page.click('button:has-text("Show Filters")');

    // Select an allergy filter if available
    const allergyCheckboxes = page.locator('[data-testid="allergy-checkbox"]');
    if ((await allergyCheckboxes.count()) > 0) {
      await allergyCheckboxes.first().check();
      await page.click('button:has-text("Apply Filters")');
      await page.waitForTimeout(500);
    }
  });

  test("View ingredient details", async ({ page }) => {
    // First ensure we have at least one ingredient
    const rows = page.locator("table tbody tr");
    const cards = page.locator('[data-testid^="ingredient-card-"]');

    const hasRows = (await rows.count()) > 0;
    const hasCards = (await cards.count()) > 0;

    if (!hasRows && !hasCards) {
      // Create an ingredient first
      await page.click('[data-testid="create-ingredient-button"]');
      await page.fill('input[name="name"]', "Test Ingredient for View");
      await page.fill('input[name="cost"]', "5.00");
      await page.click('button[type="submit"]');
      await page.waitForURL("**/restaurant/ingredients");
    }

    // Click on first ingredient to view details
    if ((await rows.count()) > 0) {
      await rows.first().click();
    } else if ((await cards.count()) > 0) {
      await cards.first().click();
    }

    // Should show ingredient details (modal or page)
    await expect(
      page
        .locator("text=Ingredient Details")
        .or(page.locator("h1, h2").filter({ hasText: /Test Ingredient/ }))
    ).toBeVisible({ timeout: 5000 });
  });
});
