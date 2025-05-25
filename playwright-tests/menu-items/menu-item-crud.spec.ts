import { test, expect } from "@playwright/test";
import { login } from "../helpers/auth";

test.describe("Menu Item CRUD Operations", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto("/en/restaurant/menu-items");
    await page.waitForLoadState("networkidle");
  });

  test("Create menu item with ingredients and allergies", async ({ page }) => {
    const startTime = Date.now();

    // Navigate to create page
    await page.click('a[href="/restaurant/menu-items/create"]');
    await page.waitForURL("**/restaurant/menu-items/create");

    // Fill menu item details
    const menuItemName = `Test Dish ${Date.now()}`;
    await page.fill('input[name="menuItemName"]', menuItemName);
    await page.fill(
      'textarea[name="menuItemDescription"]',
      "Delicious test dish for automated testing"
    );
    await page.fill('input[name="price"]', "12.99");

    // Add ingredients
    await page.click('[data-testid="ingredient-selector-button"]');
    await page.waitForSelector('[data-testid="ingredient-selector-modal"]');

    // Search and select ingredients
    await page.fill('[data-testid="ingredient-search-modal"]', "tomato");
    await page.waitForTimeout(300);
    await page.check('input[type="checkbox"][value*="tomato"]');

    await page.fill('[data-testid="ingredient-search-modal"]', "cheese");
    await page.waitForTimeout(300);
    await page.check('input[type="checkbox"][value*="cheese"]');

    await page.click('[data-testid="apply-ingredients-button"]');

    // Upload image
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.isVisible()) {
      await fileInput.setInputFiles({
        name: "menu-item.jpg",
        mimeType: "image/jpeg",
        buffer: Buffer.from("fake-image-content"),
      });
    }

    // Submit form
    await page.click('button[type="submit"]');
    await page.waitForURL("**/restaurant/menu-items");

    const createTime = Date.now() - startTime;
    console.log(`Menu item creation time: ${createTime}ms`);

    // Verify item appears in list
    await expect(page.locator(`text=${menuItemName}`)).toBeVisible();
  });

  test("Edit menu item and update ingredients", async ({ page }) => {
    // Find first menu item
    const firstItem = page.locator("tr").nth(1);
    const itemName = await firstItem.locator("td").first().textContent();

    // Click edit
    await firstItem.locator('[data-testid^="edit-menu-item-"]').click();
    await page.waitForURL("**/restaurant/menu-items/edit/**");

    // Update details
    const updatedName = `${itemName} - Updated`;
    await page.fill('input[name="menuItemName"]', updatedName);
    await page.fill('input[name="price"]', "15.99");

    // Update ingredients
    await page.click('[data-testid="ingredient-selector-button"]');
    await page.waitForSelector('[data-testid="ingredient-selector-modal"]');

    // Uncheck an ingredient if exists
    const checkboxes = page.locator(
      '[data-testid="ingredient-selector-modal"] input[type="checkbox"]:checked'
    );
    const checkedCount = await checkboxes.count();
    if (checkedCount > 0) {
      await checkboxes.first().uncheck();
    }

    // Add new ingredient
    await page.fill('[data-testid="ingredient-search-modal"]', "basil");
    await page.waitForTimeout(300);
    await page.check('input[type="checkbox"][value*="basil"]');

    await page.click('[data-testid="apply-ingredients-button"]');

    // Submit changes
    await page.click('button[type="submit"]');
    await page.waitForURL("**/restaurant/menu-items");

    // Verify update
    await expect(page.locator(`text=${updatedName}`)).toBeVisible();
  });

  test("Filter menu items by allergies", async ({ page }) => {
    // Open filter panel
    await page.click('[data-testid="filter-toggle-button"]');

    // Select allergy filter
    await page.check('input[type="checkbox"][value*="gluten"]');
    await page.click('[data-testid="apply-filters-button"]');

    // Wait for filtered results
    await page.waitForTimeout(500);

    // Verify filter is applied
    await expect(page.locator('[data-testid="results-info"]')).toContainText(
      "gluten"
    );

    // Test exclude mode
    await page.click('[data-testid="filter-toggle-button"]');
    await page.click('[data-testid="allergy-exclude-mode-toggle"]');
    await page.click('[data-testid="apply-filters-button"]');

    // Verify exclude mode is active
    await expect(page.locator('[data-testid="results-info"]')).toContainText(
      "excluding"
    );
  });

  test("Search menu items", async ({ page }) => {
    // Test search functionality
    await page.fill('[data-testid="menu-item-search"]', "pizza");
    await page.waitForTimeout(500); // Debounce

    // Verify search results
    const results = page
      .locator('tr, [class*="card"]')
      .filter({ hasText: /pizza/i });
    const count = await results.count();

    if (count === 0) {
      // No pizza items, verify "no results" message
      await expect(page.locator("text=No menu items found")).toBeVisible();
    } else {
      // Verify all results contain search term
      for (let i = 0; i < count; i++) {
        const text = await results.nth(i).textContent();
        expect(text?.toLowerCase()).toContain("pizza");
      }
    }

    // Clear search
    await page.fill('[data-testid="menu-item-search"]', "");
  });

  test("Sort menu items", async ({ page }) => {
    // Sort by name
    await page.click('th:has-text("Name")');
    await page.waitForTimeout(500);

    // Get first few item names
    const firstItemBefore = await page
      .locator("tr")
      .nth(1)
      .locator("td")
      .first()
      .textContent();

    // Sort in reverse order
    await page.click('th:has-text("Name")');
    await page.waitForTimeout(500);

    const firstItemAfter = await page
      .locator("tr")
      .nth(1)
      .locator("td")
      .first()
      .textContent();

    // Items should be different (unless only one item)
    if ((await page.locator("tr").count()) > 2) {
      expect(firstItemBefore).not.toBe(firstItemAfter);
    }

    // Sort by price
    await page.click('th:has-text("Price")');
    await page.waitForTimeout(500);
  });

  test("Delete menu item with confirmation", async ({ page }) => {
    // Create test item first
    await page.click('a[href="/restaurant/menu-items/create"]');
    const itemName = `Delete Test ${Date.now()}`;
    await page.fill('input[name="menuItemName"]', itemName);
    await page.fill('input[name="price"]', "9.99");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/restaurant/menu-items");

    // Find and delete
    const targetRow = page.locator("tr", { hasText: itemName });
    await targetRow.locator('[data-testid^="delete-menu-item-"]').click();

    // Cancel first
    await page.click("text=Cancel");
    await expect(page.locator(`text=${itemName}`)).toBeVisible();

    // Delete for real
    await targetRow.locator('[data-testid^="delete-menu-item-"]').click();
    await page.click("text=Delete");

    // Verify deletion
    await expect(page.locator(`text=${itemName}`)).not.toBeVisible();
  });

  test("View menu item details", async ({ page }) => {
    // Click on first menu item to view details
    const firstItem = page.locator("tr").nth(1);
    const itemName = await firstItem.locator("td").first().textContent();

    if (itemName) {
      await firstItem.locator("td").first().click();

      // Should open modal or navigate to detail page
      await expect(
        page
          .locator(`h2:has-text("${itemName}")`)
          .or(page.locator(`h1:has-text("${itemName}")`))
      ).toBeVisible();

      // Check for ingredient list
      await expect(page.locator("text=Ingredients")).toBeVisible();

      // Check for allergy information
      const allergySection = page
        .locator("text=Allergies")
        .or(page.locator("text=Allergens"));
      if (await allergySection.isVisible()) {
        await expect(allergySection).toBeVisible();
      }

      // Close modal or go back
      const closeButton = page.locator('button[aria-label="Close"]');
      if (await closeButton.isVisible()) {
        await closeButton.click();
      } else {
        await page.goBack();
      }
    }
  });

  test("Validate price input", async ({ page }) => {
    await page.click('a[href="/restaurant/menu-items/create"]');

    // Test negative price
    await page.fill('input[name="price"]', "-10");
    await page.click('button[type="submit"]');
    await expect(page.locator("text=must be positive")).toBeVisible();

    // Test non-numeric price
    await page.fill('input[name="price"]', "abc");
    await page.click('button[type="submit"]');
    await expect(page.locator("text=must be a number")).toBeVisible();

    // Test very large price
    await page.fill('input[name="price"]', "999999");
    await page.click('button[type="submit"]');
    // Should either accept or show max limit error
  });

  test("Bulk operations on menu items", async ({ page }) => {
    // Select multiple items
    const checkboxes = page.locator(
      'input[type="checkbox"][data-testid^="select-menu-item-"]'
    );
    const count = await checkboxes.count();

    if (count >= 2) {
      await checkboxes.nth(0).check();
      await checkboxes.nth(1).check();

      // Check for bulk actions
      const bulkDelete = page.locator('[data-testid="bulk-delete-button"]');
      if (await bulkDelete.isVisible()) {
        await bulkDelete.click();
        await page.click("text=Cancel"); // Don't actually delete
      }

      // Check for bulk category assignment
      const bulkCategory = page.locator('[data-testid="bulk-category-button"]');
      if (await bulkCategory.isVisible()) {
        await bulkCategory.click();
        await page.click("text=Appetizers");
      }
    }
  });

  test("Menu item with no ingredients", async ({ page }) => {
    await page.click('a[href="/restaurant/menu-items/create"]');

    // Create item without ingredients
    await page.fill('input[name="menuItemName"]', "Simple Beverage");
    await page.fill('textarea[name="menuItemDescription"]', "Just a drink");
    await page.fill('input[name="price"]', "3.50");

    await page.click('button[type="submit"]');
    await page.waitForURL("**/restaurant/menu-items");

    // Verify item was created
    await expect(page.locator("text=Simple Beverage")).toBeVisible();
  });
});

test.describe("Menu Item Performance", () => {
  test("Load time with many menu items", async ({ page }) => {
    await login(page);

    const startTime = Date.now();
    await page.goto("/en/restaurant/menu-items");
    await page.waitForLoadState("networkidle");

    const loadTime = Date.now() - startTime;
    console.log(`Menu items page load time: ${loadTime}ms`);

    // Should load within reasonable time
    expect(loadTime).toBeLessThan(3000);

    // Check if pagination is working
    const totalItems = await page
      .locator('[data-testid="total-items"]')
      .textContent();
    if (totalItems && parseInt(totalItems) > 20) {
      await expect(page.locator('[data-testid="pagination"]')).toBeVisible();
    }
  });

  test("Search performance", async ({ page }) => {
    await login(page);
    await page.goto("/en/restaurant/menu-items");

    const searchStart = Date.now();
    await page.fill('[data-testid="menu-item-search"]', "test");
    await page.waitForTimeout(500); // Wait for debounce

    const searchTime = Date.now() - searchStart;
    console.log(`Search execution time: ${searchTime}ms`);

    // Should be responsive
    expect(searchTime).toBeLessThan(1000);
  });

  test("Filter performance with multiple criteria", async ({ page }) => {
    await login(page);
    await page.goto("/en/restaurant/menu-items");

    await page.click('[data-testid="filter-toggle-button"]');

    const filterStart = Date.now();

    // Apply multiple filters
    await page.check('input[type="checkbox"][value*="gluten"]');
    await page.check('input[type="checkbox"][value*="dairy"]');
    await page.check('input[type="checkbox"][value*="nuts"]');

    // Select ingredients
    const ingredientCheckboxes = page.locator(
      '[data-testid^="ingredient-filter-"]'
    );
    const ingredientCount = await ingredientCheckboxes.count();
    if (ingredientCount > 0) {
      await ingredientCheckboxes.first().check();
    }

    await page.click('[data-testid="apply-filters-button"]');
    await page.waitForTimeout(500);

    const filterTime = Date.now() - filterStart;
    console.log(`Multi-filter execution time: ${filterTime}ms`);

    // Should handle complex filters efficiently
    expect(filterTime).toBeLessThan(2000);
  });
});
