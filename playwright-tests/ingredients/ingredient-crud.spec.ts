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

    // Click create button
    await page.click('a[href="/restaurant/ingredients/create"]');
    await page.waitForURL("**/restaurant/ingredients/create");

    const navigationTime = Date.now() - startTime;
    console.log(`Navigation to create page: ${navigationTime}ms`);

    // Fill in ingredient form
    const ingredientName = `Test Ingredient ${Date.now()}`;
    await page.fill('input[name="ingredientName"]', ingredientName);
    await page.fill(
      'input[name="description"]',
      "Test description for automated testing"
    );
    await page.fill('input[name="quantity"]', "100");
    await page.fill('input[name="unit"]', "grams");
    await page.fill('input[name="cost"]', "5.99");

    // Select category
    await page.click('[data-testid="category-select"]');
    await page.click("text=Vegetables");

    // Select allergies
    await page.click('[data-testid="allergy-selector-button"]');
    await page.check('input[type="checkbox"][value*="gluten"]');
    await page.check('input[type="checkbox"][value*="dairy"]');
    await page.click("text=Apply"); // Close allergy selector

    // Submit form
    const submitStart = Date.now();
    await page.click('button[type="submit"]');

    // Wait for redirect to ingredient list
    await page.waitForURL("**/restaurant/ingredients");
    const submitTime = Date.now() - submitStart;
    console.log(`Ingredient creation time: ${submitTime}ms`);

    // Verify ingredient appears in list
    await expect(page.locator(`text=${ingredientName}`)).toBeVisible();
  });

  test("Edit existing ingredient", async ({ page }) => {
    // Find first ingredient in list
    const firstIngredient = page.locator("tr").nth(1);
    const ingredientName = await firstIngredient
      .locator("td")
      .first()
      .textContent();

    // Click edit button
    await firstIngredient.locator('[data-testid^="edit-ingredient-"]').click();
    await page.waitForURL("**/restaurant/ingredients/edit/**");

    // Modify ingredient
    const updatedName = `${ingredientName} - Updated`;
    await page.fill('input[name="ingredientName"]', updatedName);
    await page.fill('input[name="description"]', "Updated description");

    // Submit changes
    await page.click('button[type="submit"]');
    await page.waitForURL("**/restaurant/ingredients");

    // Verify update
    await expect(page.locator(`text=${updatedName}`)).toBeVisible();
  });

  test("Delete ingredient with confirmation", async ({ page }) => {
    // Create a test ingredient first
    await page.click('a[href="/restaurant/ingredients/create"]');
    const ingredientName = `Delete Test ${Date.now()}`;
    await page.fill('input[name="ingredientName"]', ingredientName);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/restaurant/ingredients");

    // Find and delete the ingredient
    const targetRow = page.locator("tr", { hasText: ingredientName });
    await targetRow.locator('[data-testid^="delete-ingredient-"]').click();

    // Confirm deletion in dialog
    await page.click("text=Delete");

    // Verify ingredient is removed
    await expect(page.locator(`text=${ingredientName}`)).not.toBeVisible();
  });

  test("Search and filter ingredients", async ({ page }) => {
    // Test search functionality
    await page.fill('[data-testid="ingredient-search"]', "tomato");
    await page.waitForTimeout(500); // Debounce

    // Verify search results
    const results = page.locator('tr, [class*="card"]');
    const count = await results.count();

    if (count > 1) {
      // Assuming header row
      const firstResult = await results.nth(1).textContent();
      expect(firstResult?.toLowerCase()).toContain("tomato");
    }

    // Test filter by category
    await page.click('[data-testid="filter-toggle-button"]');
    await page.check('input[type="checkbox"][value="Dairy"]');
    await page.click('[data-testid="apply-filters-button"]');

    // Test filter by allergy
    await page.click('[data-testid="filter-toggle-button"]');
    await page.check('input[type="checkbox"][value*="gluten"]');
    await page.click('[data-testid="apply-filters-button"]');

    // Reset filters
    await page.click('[data-testid="reset-filters-button"]');
  });

  test("Bulk select and operations", async ({ page }) => {
    // Select multiple ingredients
    const checkboxes = page.locator(
      'input[type="checkbox"][data-testid^="select-ingredient-"]'
    );
    const count = await checkboxes.count();

    if (count >= 3) {
      await checkboxes.nth(0).check();
      await checkboxes.nth(1).check();
      await checkboxes.nth(2).check();

      // Verify bulk action buttons appear
      await expect(
        page.locator('[data-testid="bulk-delete-button"]')
      ).toBeVisible();
    }
  });

  test("Validate required fields", async ({ page }) => {
    await page.click('a[href="/restaurant/ingredients/create"]');

    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Check for validation errors
    await expect(page.locator("text=Required")).toBeVisible();

    // Fill only name and try again
    await page.fill('input[name="ingredientName"]', "Test");
    await page.click('button[type="submit"]');

    // Should still have errors for other required fields
    const errors = await page.locator(".mantine-TextInput-error").count();
    expect(errors).toBeGreaterThan(0);
  });

  test("Sub-ingredient management", async ({ page }) => {
    await page.click('a[href="/restaurant/ingredients/create"]');

    // Add main ingredient details
    await page.fill('input[name="ingredientName"]', "Composite Ingredient");

    // Add sub-ingredients
    await page.click('[data-testid="add-sub-ingredient"]');
    await page.click('[data-testid="sub-ingredient-select"]');
    await page.click("text=Salt");
    await page.fill('input[name="subIngredientQuantity"]', "5");

    // Add another sub-ingredient
    await page.click('[data-testid="add-sub-ingredient"]');
    const selectors = page.locator('[data-testid="sub-ingredient-select"]');
    await selectors.last().click();
    await page.click("text=Pepper");

    await page.click('button[type="submit"]');
    await page.waitForURL("**/restaurant/ingredients");
  });

  test("Image upload for ingredient", async ({ page }) => {
    await page.click('a[href="/restaurant/ingredients/create"]');

    // Upload image
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "test-ingredient.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.from("fake-image-content"),
    });

    // Verify image preview appears
    await expect(page.locator('img[alt*="preview"]')).toBeVisible();

    // Fill other required fields
    await page.fill('input[name="ingredientName"]', "Ingredient with Image");
    await page.click('button[type="submit"]');
  });

  test("Pagination and sorting", async ({ page }) => {
    // Test sorting by name
    await page.click('th:has-text("Name")');
    await page.waitForTimeout(500);

    // Verify sort indicator
    await expect(page.locator('th:has-text("Name") svg')).toBeVisible();

    // Test sorting by category
    await page.click('th:has-text("Category")');
    await page.waitForTimeout(500);

    // Test pagination if available
    const nextButton = page.locator('button[aria-label="Next page"]');
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForTimeout(500);

      // Verify page changed
      const pageIndicator = page.locator('[data-testid="page-indicator"]');
      await expect(pageIndicator).toContainText("2");
    }
  });

  test("Export ingredients data", async ({ page }) => {
    // Look for export button
    const exportButton = page.locator('[data-testid="export-ingredients"]');
    if (await exportButton.isVisible()) {
      // Start waiting for download before clicking
      const downloadPromise = page.waitForEvent("download");
      await exportButton.click();

      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain("ingredients");
    }
  });
});

test.describe("Ingredient Edge Cases", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("Handle duplicate ingredient names", async ({ page }) => {
    await page.goto("/en/restaurant/ingredients/create");

    // Try to create ingredient with existing name
    await page.fill('input[name="ingredientName"]', "Salt"); // Assuming Salt exists
    await page.click('button[type="submit"]');

    // Should show error
    await expect(page.locator("text=already exists")).toBeVisible();
  });

  test("Handle very long ingredient names", async ({ page }) => {
    await page.goto("/en/restaurant/ingredients/create");

    const longName = "A".repeat(256);
    await page.fill('input[name="ingredientName"]', longName);
    await page.click('button[type="submit"]');

    // Should either truncate or show error
    const error = page.locator("text=too long");
    const success = page.locator("text=created successfully");

    await expect(error.or(success)).toBeVisible();
  });

  test("Handle special characters in ingredient names", async ({ page }) => {
    await page.goto("/en/restaurant/ingredients/create");

    const specialName = 'Ingredient!@#$%^&*()_+{}[]|\\:";<>?,./';
    await page.fill('input[name="ingredientName"]', specialName);
    await page.click('button[type="submit"]');

    // Should handle special characters gracefully
    await page.waitForURL("**/restaurant/ingredients");
  });

  test("Network error handling", async ({ page }) => {
    await page.goto("/en/restaurant/ingredients");

    // Simulate offline
    await page.route("**/api/**", (route) => route.abort());

    // Try to create ingredient
    await page.click('a[href="/restaurant/ingredients/create"]');
    await page.fill('input[name="ingredientName"]', "Offline Test");
    await page.click('button[type="submit"]');

    // Should show network error
    await expect(
      page.locator("text=network error", { ignoreCase: true })
    ).toBeVisible();
  });
});
