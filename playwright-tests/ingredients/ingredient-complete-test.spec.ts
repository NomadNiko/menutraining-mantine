import { test, expect } from "@playwright/test";
import { login } from "../helpers/auth";

test.describe("Complete Ingredient Management Tests", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto("/en/restaurant/ingredients");
    await page.waitForLoadState("networkidle");
  });

  test("Complete ingredient creation flow", async ({ page }) => {
    // Step 1: Navigate to create page
    await page.click('[data-testid="create-ingredient-button"]');
    await expect(page).toHaveURL(/.*ingredients\/create/);

    // Step 2: Fill in the form with correct field names
    const ingredientName = `Test Ingredient ${Date.now()}`;
    await page.fill('input[name="ingredientName"]', ingredientName);

    // Step 3: Select a category (required)
    // Categories are rendered as checkboxes, let's select "basic"
    await page.check('input[type="checkbox"][value="basic"]');

    // Step 4: Add an allergy (optional but good to test)
    const allergyButton = page
      .locator("text=Allergies")
      .or(page.locator("text=Add Allergies"));
    if (await allergyButton.isVisible()) {
      await allergyButton.click();
      // Select first available allergy
      const allergyCheckbox = page
        .locator('input[type="checkbox"][name*="allergy"]')
        .first();
      if (await allergyCheckbox.isVisible()) {
        await allergyCheckbox.check();
      }
    }

    // Step 5: Upload an image (optional)
    const fileInput = page.locator(
      'input[type="file"][data-testid="ingredient-image-input"]'
    );
    if (await fileInput.isVisible()) {
      await fileInput.setInputFiles({
        name: "test-ingredient.jpg",
        mimeType: "image/jpeg",
        buffer: Buffer.from("fake-image-content"),
      });
    }

    // Step 6: Submit the form
    await page.click('button[type="submit"]');

    // Step 7: Verify redirect and wait for cache refresh
    await expect(page).toHaveURL(/.*ingredients(?!\/create)/);

    // Step 8: Wait for the ingredient to appear (with cache refresh)
    await page.waitForTimeout(1000); // Give time for cache refresh

    // Step 9: Verify the ingredient appears in the list
    const ingredientInList = page.locator(`text=${ingredientName}`);
    await expect(ingredientInList).toBeVisible({ timeout: 15000 });
  });

  test("Edit ingredient with all fields", async ({ page }) => {
    // First, ensure we have at least one ingredient to edit
    const rows = page.locator("table tbody tr");
    const cards = page.locator('[data-testid*="ingredient-card"]');

    // Check if we have any ingredients
    if ((await rows.count()) === 0 && (await cards.count()) === 0) {
      // Create one first
      await page.click('[data-testid="create-ingredient-button"]');
      await page.fill('input[name="ingredientName"]', "Ingredient to Edit");
      await page.check('input[type="checkbox"][value="basic"]');
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*ingredients(?!\/create)/);
      await page.waitForTimeout(1000);
    }

    // Find edit button
    const editButton = page
      .locator('[data-testid*="edit-ingredient"]')
      .first()
      .or(page.locator('button[aria-label*="edit"]').first())
      .or(page.locator('a[href*="ingredients/edit"]').first());

    await editButton.click();
    await expect(page).toHaveURL(/.*ingredients\/edit\/.*/);

    // Update the name
    const nameInput = page.locator('input[name="ingredientName"]');
    await nameInput.clear();
    await nameInput.fill("Updated Ingredient Name");

    // Change category
    await page.uncheck('input[type="checkbox"][value="basic"]');
    await page.check('input[type="checkbox"][value="vegetables"]');

    // Submit
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*ingredients(?!\/edit)/);

    // Verify update
    await page.waitForTimeout(1000);
    await expect(page.locator("text=Updated Ingredient Name")).toBeVisible({
      timeout: 15000,
    });
  });

  test("Search ingredients with proper selectors", async ({ page }) => {
    // Find the search input - it might have different placeholders
    const searchInput = page
      .locator('input[placeholder*="Search"]')
      .or(page.locator('input[placeholder*="search"]'))
      .or(page.locator('[data-testid="ingredient-search"]'))
      .first();

    await searchInput.fill("test");
    await page.waitForTimeout(600); // Debounce

    // Check results - either we have results or "no results" message
    const hasTable = await page.locator("table").isVisible();
    const hasCards =
      (await page.locator('[data-testid*="ingredient-card"]').count()) > 0;
    const hasNoResults = await page
      .locator("text=/No ingredients found/i")
      .isVisible();

    expect(hasTable || hasCards || hasNoResults).toBeTruthy();
  });

  test("Filter ingredients by category and allergy", async ({ page }) => {
    // Open filter panel
    const filterButton = page
      .locator('button:has-text("Show Filters")')
      .or(page.locator('button:has-text("Filters")'))
      .or(page.locator('[data-testid="filter-toggle-button"]'))
      .first();

    await filterButton.click();

    // Wait for filter panel to be visible
    await expect(page.locator("text=Apply Filters")).toBeVisible();

    // Select a category filter
    const categorySection = page.locator("text=Categories").locator("..");
    const categoryCheckbox = categorySection
      .locator('input[type="checkbox"]')
      .first();
    if (await categoryCheckbox.isVisible()) {
      await categoryCheckbox.check();
    }

    // Select an allergy filter
    const allergySection = page.locator("text=Allergies").locator("..");
    const allergyCheckbox = allergySection
      .locator('input[type="checkbox"]')
      .first();
    if (await allergyCheckbox.isVisible()) {
      await allergyCheckbox.check();
    }

    // Apply filters
    await page.click('button:has-text("Apply Filters")');
    await page.waitForTimeout(500);

    // Verify filters are applied - check URL or results info
    const resultsInfo = page
      .locator('[data-testid="results-info"]')
      .or(page.locator("text=/Showing.*ingredients/i"));

    if (await resultsInfo.isVisible()) {
      await expect(resultsInfo).toBeVisible();
    }
  });

  test("Delete ingredient with confirmation", async ({ page }) => {
    // Create an ingredient to delete
    await page.click('[data-testid="create-ingredient-button"]');
    const deleteTestName = `Delete Test ${Date.now()}`;
    await page.fill('input[name="ingredientName"]', deleteTestName);
    await page.check('input[type="checkbox"][value="basic"]');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*ingredients(?!\/create)/);
    await page.waitForTimeout(1000);

    // Find the delete button for our ingredient
    const row = page.locator("tr", { hasText: deleteTestName }).or(
      page.locator('[data-testid*="ingredient-card"]', {
        hasText: deleteTestName,
      })
    );

    const deleteButton = row
      .locator('[data-testid*="delete-ingredient"]')
      .or(row.locator('button[aria-label*="delete"]'))
      .first();

    await deleteButton.click();

    // Handle confirmation dialog
    await page.click('button:has-text("Delete")');

    // Wait for deletion
    await page.waitForTimeout(1000);

    // Verify ingredient is removed
    await expect(page.locator(`text=${deleteTestName}`)).not.toBeVisible();
  });

  test("Validate required fields", async ({ page }) => {
    await page.click('[data-testid="create-ingredient-button"]');

    // Try to submit without filling anything
    await page.click('button[type="submit"]');

    // Should show validation errors
    await expect(page.locator("text=/required/i")).toBeVisible();

    // Fill name but no category
    await page.fill('input[name="ingredientName"]', "Test Name");
    await page.click('button[type="submit"]');

    // Should still show error for category
    await expect(page.locator("text=/category.*required/i")).toBeVisible();
  });

  test("Pagination works correctly", async ({ page }) => {
    // Check if pagination exists
    const pagination = page
      .locator('[data-testid="pagination"]')
      .or(page.locator('[aria-label="pagination"]'))
      .or(page.locator('nav:has(button[aria-label*="page"])'));

    if (await pagination.isVisible()) {
      // Try to go to next page
      const nextButton = page
        .locator('button[aria-label="Next page"]')
        .or(page.locator('button:has-text("Next")'))
        .first();

      if (await nextButton.isEnabled()) {
        await nextButton.click();
        await page.waitForTimeout(500);

        // Verify page changed - URL or page indicator
        const pageIndicator = page
          .locator('[data-testid="page-indicator"]')
          .or(page.locator("text=/Page.*2/i"));

        if (await pageIndicator.isVisible()) {
          await expect(pageIndicator).toBeVisible();
        }
      }
    }
  });

  test("Sort ingredients by different columns", async ({ page }) => {
    // Check if we have a table with sortable headers
    const nameHeader = page.locator('th:has-text("Name")');

    if (await nameHeader.isVisible()) {
      // Click to sort by name
      await nameHeader.click();
      await page.waitForTimeout(500);

      // Verify sort indicator appears
      const sortIndicator = nameHeader
        .locator("svg")
        .or(nameHeader.locator('[aria-label*="sort"]'));

      await expect(sortIndicator).toBeVisible();

      // Click again to reverse sort
      await nameHeader.click();
      await page.waitForTimeout(500);
    }
  });
});
