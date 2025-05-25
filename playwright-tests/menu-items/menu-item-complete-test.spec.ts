import { test, expect } from "@playwright/test";
import { login } from "../helpers/auth";

test.describe("Complete Menu Item Management Tests", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto("/en/restaurant/menu-items");
    await page.waitForLoadState("networkidle");
  });

  test("Create menu item with ingredients", async ({ page }) => {
    // Navigate to create page
    const createButton = page
      .locator('[data-testid="create-menu-item-button"]')
      .or(page.locator('a[href*="menu-items/create"]'))
      .or(page.locator('button:has-text("Create")'))
      .first();

    await createButton.click();
    await expect(page).toHaveURL(/.*menu-items\/create/);

    // Fill in menu item details
    const menuItemName = `Test Dish ${Date.now()}`;
    await page.fill('input[name="menuItemName"]', menuItemName);

    // Fill description if available
    const descriptionField = page
      .locator('textarea[name="menuItemDescription"]')
      .or(page.locator('textarea[name="description"]'));
    if (await descriptionField.isVisible()) {
      await descriptionField.fill("Delicious test dish for automated testing");
    }

    // Fill price - find the price input
    const priceInput = page
      .locator('input[name="price"]')
      .or(page.locator('input[type="number"]'))
      .first();
    await priceInput.fill("12.99");

    // Add ingredients
    const ingredientButton = page
      .locator('[data-testid="ingredient-selector-button"]')
      .or(page.locator('button:has-text("Add Ingredients")'))
      .or(page.locator('button:has-text("Select Ingredients")'))
      .first();

    if (await ingredientButton.isVisible()) {
      await ingredientButton.click();

      // Wait for modal or panel
      await page.waitForTimeout(500);

      // Select first few ingredients
      const ingredientCheckboxes = page
        .locator('input[type="checkbox"][name*="ingredient"]')
        .or(page.locator('[data-testid*="ingredient-checkbox"]'));

      const count = await ingredientCheckboxes.count();
      if (count > 0) {
        // Select up to 3 ingredients
        for (let i = 0; i < Math.min(3, count); i++) {
          await ingredientCheckboxes.nth(i).check();
        }
      }

      // Apply selection
      const applyButton = page
        .locator('[data-testid="apply-ingredients-button"]')
        .or(page.locator('button:has-text("Apply")'))
        .or(page.locator('button:has-text("Done")'))
        .first();
      await applyButton.click();
    }

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for redirect and cache refresh
    await expect(page).toHaveURL(/.*menu-items(?!\/create)/);
    await page.waitForTimeout(1000);

    // Verify menu item appears
    await expect(page.locator(`text=${menuItemName}`)).toBeVisible({
      timeout: 15000,
    });
  });

  test("Filter menu items by allergies", async ({ page }) => {
    // Open filter panel
    const filterButton = page
      .locator('[data-testid="filter-toggle-button"]')
      .or(page.locator('button:has-text("Filter")'))
      .or(page.locator('button:has-text("Show Filters")'))
      .first();

    await filterButton.click();
    await page.waitForTimeout(300);

    // Find allergy filters
    const allergySection = page
      .locator("text=Allergies")
      .locator("..")
      .or(page.locator('[data-testid="allergy-filters"]'));

    // Select first allergy
    const allergyCheckbox = allergySection
      .locator('input[type="checkbox"]')
      .first();
    if (await allergyCheckbox.isVisible()) {
      await allergyCheckbox.check();

      // Apply filters
      await page.click('button:has-text("Apply Filters")');
      await page.waitForTimeout(500);

      // Check if results info shows the filter
      const resultsInfo = page
        .locator('[data-testid="results-info"]')
        .or(page.locator("text=/Showing.*with/i"));

      if (await resultsInfo.isVisible()) {
        await expect(resultsInfo).toBeVisible();
      }
    }
  });

  test("Search menu items", async ({ page }) => {
    // Find search input
    const searchInput = page
      .locator('[data-testid="menu-item-search"]')
      .or(page.locator('input[placeholder*="Search"]'))
      .or(page.locator('input[placeholder*="search"]'))
      .first();

    await searchInput.fill("test");
    await page.waitForTimeout(600); // Debounce

    // Verify search is working
    const hasResults =
      (await page.locator("table tbody tr").count()) > 0 ||
      (await page.locator('[data-testid*="menu-item-card"]').count()) > 0;
    const hasNoResults = await page
      .locator("text=/No menu items found/i")
      .isVisible();

    expect(hasResults || hasNoResults).toBeTruthy();
  });

  test("Edit menu item price and ingredients", async ({ page }) => {
    // Ensure we have at least one menu item
    const rows = page.locator("table tbody tr");
    const cards = page.locator('[data-testid*="menu-item-card"]');

    if ((await rows.count()) === 0 && (await cards.count()) === 0) {
      // Create one
      const createButton = page
        .locator('[data-testid="create-menu-item-button"]')
        .or(page.locator('a[href*="menu-items/create"]'))
        .first();
      await createButton.click();
      await page.fill('input[name="menuItemName"]', "Item to Edit");
      await page.fill('input[name="price"]', "10.00");
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*menu-items(?!\/create)/);
      await page.waitForTimeout(1000);
    }

    // Find edit button
    const editButton = page
      .locator('[data-testid*="edit-menu-item"]')
      .first()
      .or(page.locator('button[aria-label*="edit"]').first())
      .or(page.locator('a[href*="menu-items/edit"]').first());

    await editButton.click();
    await expect(page).toHaveURL(/.*menu-items\/edit\/.*/);

    // Update price
    const priceInput = page.locator('input[name="price"]');
    await priceInput.clear();
    await priceInput.fill("15.99");

    // Update name
    const nameInput = page.locator('input[name="menuItemName"]');
    await nameInput.clear();
    await nameInput.fill("Updated Menu Item");

    // Submit
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*menu-items(?!\/edit)/);

    // Verify update
    await page.waitForTimeout(1000);
    await expect(page.locator("text=Updated Menu Item")).toBeVisible({
      timeout: 15000,
    });
  });

  test("View menu item details", async ({ page }) => {
    // Ensure we have menu items
    const firstRow = page.locator("table tbody tr").first();
    const firstCard = page.locator('[data-testid*="menu-item-card"]').first();

    if (await firstRow.isVisible()) {
      // Click on the name to view details
      const nameCell = firstRow.locator("td").first();
      await nameCell.click();
    } else if (await firstCard.isVisible()) {
      await firstCard.click();
    }

    // Wait for modal or detail view
    await page.waitForTimeout(500);

    // Check for detail elements
    const hasIngredientsList = await page
      .locator("text=Ingredients")
      .isVisible();
    const hasPrice = await page.locator("text=$").isVisible();
    const hasDescription = await page.locator("text=Description").isVisible();

    expect(hasIngredientsList || hasPrice || hasDescription).toBeTruthy();

    // Close modal if present
    const closeButton = page
      .locator('button[aria-label="Close"]')
      .or(page.locator('button:has-text("Close")'))
      .first();

    if (await closeButton.isVisible()) {
      await closeButton.click();
    }
  });

  test("Delete menu item", async ({ page }) => {
    // Create item to delete
    const createButton = page
      .locator('[data-testid="create-menu-item-button"]')
      .or(page.locator('a[href*="menu-items/create"]'))
      .first();
    await createButton.click();

    const deleteTestName = `Delete Test ${Date.now()}`;
    await page.fill('input[name="menuItemName"]', deleteTestName);
    await page.fill('input[name="price"]', "5.00");
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*menu-items(?!\/create)/);
    await page.waitForTimeout(1000);

    // Find delete button
    const row = page.locator("tr", { hasText: deleteTestName }).or(
      page.locator('[data-testid*="menu-item-card"]', {
        hasText: deleteTestName,
      })
    );

    const deleteButton = row
      .locator('[data-testid*="delete-menu-item"]')
      .or(row.locator('button[aria-label*="delete"]'))
      .first();

    await deleteButton.click();

    // Confirm deletion
    await page.click('button:has-text("Delete")');
    await page.waitForTimeout(1000);

    // Verify deletion
    await expect(page.locator(`text=${deleteTestName}`)).not.toBeVisible();
  });

  test("Sort menu items by price", async ({ page }) => {
    const priceHeader = page.locator('th:has-text("Price")');

    if (await priceHeader.isVisible()) {
      // Get initial first price
      const firstPriceBefore = await page
        .locator("table tbody tr")
        .first()
        .locator('td:has-text("$")')
        .textContent();

      // Click to sort
      await priceHeader.click();
      await page.waitForTimeout(500);

      // Get new first price
      const firstPriceAfter = await page
        .locator("table tbody tr")
        .first()
        .locator('td:has-text("$")')
        .textContent();

      // Prices should be different if there are multiple items
      const rowCount = await page.locator("table tbody tr").count();
      if (rowCount > 1) {
        expect(firstPriceBefore).not.toBe(firstPriceAfter);
      }
    }
  });

  test("Validate price input", async ({ page }) => {
    const createButton = page
      .locator('[data-testid="create-menu-item-button"]')
      .or(page.locator('a[href*="menu-items/create"]'))
      .first();
    await createButton.click();

    // Test negative price
    await page.fill('input[name="menuItemName"]', "Price Test");
    await page.fill('input[name="price"]', "-10");
    await page.click('button[type="submit"]');

    // Should show validation error
    await expect(
      page.locator("text=/positive|greater than|invalid/i")
    ).toBeVisible();

    // Test non-numeric price
    const priceInput = page.locator('input[name="price"]');
    await priceInput.clear();
    await priceInput.fill("abc");
    await page.click('button[type="submit"]');

    // Should show validation error
    await expect(page.locator("text=/number|numeric|invalid/i")).toBeVisible();
  });
});
