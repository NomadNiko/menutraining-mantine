import { test, expect } from "@playwright/test";
import { login } from "../helpers/auth";

test.describe("Menu Section CRUD Operations", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto("/en/restaurant/menu-sections");
    await page.waitForLoadState("networkidle");
  });

  test("Create new menu section with items", async ({ page }) => {
    // Navigate to create page
    const createButton = page
      .locator('[data-testid="create-menu-section-button"]')
      .or(page.locator('a[href*="menu-sections/create"]'))
      .or(page.locator('button:has-text("Create")'))
      .first();

    await createButton.click();
    await expect(page).toHaveURL(/.*menu-sections\/create/);

    // Fill menu section details
    const sectionName = `Test Section ${Date.now()}`;
    await page.fill('input[name="sectionName"]', sectionName);

    // Fill description
    const descriptionField = page
      .locator('textarea[name="description"]')
      .or(page.locator('textarea[placeholder*="description"]'));
    if (await descriptionField.isVisible()) {
      await descriptionField.fill("Test menu section for automated testing");
    }

    // Set display order
    await page.fill('input[name="displayOrder"]', "1");

    // Add menu items to section
    const addItemsButton = page
      .locator('[data-testid="add-menu-items-button"]')
      .or(page.locator('button:has-text("Add Menu Items")'))
      .or(page.locator('button:has-text("Select Items")'))
      .first();

    if (await addItemsButton.isVisible()) {
      await addItemsButton.click();

      // Wait for modal or panel
      await page.waitForTimeout(500);

      // Select first few menu items
      const itemCheckboxes = page
        .locator('input[type="checkbox"][name*="item"]')
        .or(page.locator('[data-testid*="menu-item-checkbox"]'));

      const count = await itemCheckboxes.count();
      if (count > 0) {
        // Select up to 3 items
        for (let i = 0; i < Math.min(3, count); i++) {
          await itemCheckboxes.nth(i).check();
        }
      }

      // Apply selection
      const applyButton = page
        .locator('[data-testid="apply-items-button"]')
        .or(page.locator('button:has-text("Apply")'))
        .or(page.locator('button:has-text("Done")'))
        .first();
      await applyButton.click();
    }

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for redirect
    await expect(page).toHaveURL(/.*menu-sections(?!\/create)/);
    await page.waitForTimeout(1000);

    // Verify section appears
    await expect(page.locator(`text=${sectionName}`)).toBeVisible({
      timeout: 15000,
    });
  });

  test("Edit menu section and reorder items", async ({ page }) => {
    // Ensure we have at least one section
    const rows = page.locator("table tbody tr");
    const cards = page.locator('[data-testid*="menu-section-card"]');

    if ((await rows.count()) === 0 && (await cards.count()) === 0) {
      // Create one first
      const createButton = page
        .locator('[data-testid="create-menu-section-button"]')
        .or(page.locator('a[href*="menu-sections/create"]'))
        .first();
      await createButton.click();
      await page.fill('input[name="sectionName"]', "Section to Edit");
      await page.fill('input[name="displayOrder"]', "1");
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*menu-sections(?!\/create)/);
      await page.waitForTimeout(1000);
    }

    // Find edit button
    const editButton = page
      .locator('[data-testid*="edit-menu-section"]')
      .first()
      .or(page.locator('button[aria-label*="edit"]').first())
      .or(page.locator('a[href*="menu-sections/edit"]').first());

    await editButton.click();
    await expect(page).toHaveURL(/.*menu-sections\/edit\/.*/);

    // Update section name
    const nameInput = page.locator('input[name="sectionName"]');
    await nameInput.clear();
    await nameInput.fill("Updated Section Name");

    // Update display order
    const orderInput = page.locator('input[name="displayOrder"]');
    await orderInput.clear();
    await orderInput.fill("2");

    // Submit
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*menu-sections(?!\/edit)/);

    // Verify update
    await page.waitForTimeout(1000);
    await expect(page.locator("text=Updated Section Name")).toBeVisible({
      timeout: 15000,
    });
  });

  test("View menu section details", async ({ page }) => {
    // Ensure we have sections
    const firstRow = page.locator("table tbody tr").first();
    const firstCard = page
      .locator('[data-testid*="menu-section-card"]')
      .first();

    if (await firstRow.isVisible()) {
      const nameCell = firstRow.locator("td").first();
      await nameCell.click();
    } else if (await firstCard.isVisible()) {
      await firstCard.click();
    }

    // Wait for modal or detail view
    await page.waitForTimeout(500);

    // Check for section details
    const hasItems = await page.locator("text=Menu Items").isVisible();
    const hasOrder = await page.locator("text=Display Order").isVisible();
    const hasDescription = await page.locator("text=Description").isVisible();

    expect(hasItems || hasOrder || hasDescription).toBeTruthy();

    // Close modal if present
    const closeButton = page
      .locator('button[aria-label="Close"]')
      .or(page.locator('button:has-text("Close")'))
      .first();

    if (await closeButton.isVisible()) {
      await closeButton.click();
    }
  });

  test("Delete menu section", async ({ page }) => {
    // Create section to delete
    const createButton = page
      .locator('[data-testid="create-menu-section-button"]')
      .or(page.locator('a[href*="menu-sections/create"]'))
      .first();
    await createButton.click();

    const deleteTestName = `Delete Section ${Date.now()}`;
    await page.fill('input[name="sectionName"]', deleteTestName);
    await page.fill('input[name="displayOrder"]', "99");
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*menu-sections(?!\/create)/);
    await page.waitForTimeout(1000);

    // Find delete button
    const row = page.locator("tr", { hasText: deleteTestName }).or(
      page.locator('[data-testid*="menu-section-card"]', {
        hasText: deleteTestName,
      })
    );

    const deleteButton = row
      .locator('[data-testid*="delete-menu-section"]')
      .or(row.locator('button[aria-label*="delete"]'))
      .first();

    await deleteButton.click();

    // Confirm deletion
    await page.click('button:has-text("Delete")');
    await page.waitForTimeout(1000);

    // Verify deletion
    await expect(page.locator(`text=${deleteTestName}`)).not.toBeVisible();
  });

  test("Sort menu sections by display order", async ({ page }) => {
    const orderHeader = page
      .locator('th:has-text("Display Order")')
      .or(page.locator('th:has-text("Order")'));

    if (await orderHeader.isVisible()) {
      // Click to sort
      await orderHeader.click();
      await page.waitForTimeout(500);

      // Verify sort indicator
      const sortIndicator = orderHeader
        .locator("svg")
        .or(orderHeader.locator('[aria-label*="sort"]'));

      await expect(sortIndicator).toBeVisible();
    }
  });

  test("Validate display order input", async ({ page }) => {
    const createButton = page
      .locator('[data-testid="create-menu-section-button"]')
      .or(page.locator('a[href*="menu-sections/create"]'))
      .first();
    await createButton.click();

    // Test negative order
    await page.fill('input[name="sectionName"]', "Order Test");
    await page.fill('input[name="displayOrder"]', "-1");
    await page.click('button[type="submit"]');

    // Should show validation error
    await expect(
      page.locator("text=/positive|greater than|invalid/i")
    ).toBeVisible();

    // Test non-numeric order
    const orderInput = page.locator('input[name="displayOrder"]');
    await orderInput.clear();
    await orderInput.fill("abc");
    await page.click('button[type="submit"]');

    // Should show validation error
    await expect(page.locator("text=/number|numeric|invalid/i")).toBeVisible();
  });

  test("Search menu sections", async ({ page }) => {
    // Find search input
    const searchInput = page
      .locator('[data-testid="menu-section-search"]')
      .or(page.locator('input[placeholder*="Search"]'))
      .or(page.locator('input[placeholder*="search"]'))
      .first();

    await searchInput.fill("test");
    await page.waitForTimeout(600); // Debounce

    // Verify search is working
    const hasResults =
      (await page.locator("table tbody tr").count()) > 0 ||
      (await page.locator('[data-testid*="menu-section-card"]').count()) > 0;
    const hasNoResults = await page
      .locator("text=/No menu sections found/i")
      .isVisible();

    expect(hasResults || hasNoResults).toBeTruthy();
  });

  test("Duplicate menu section", async ({ page }) => {
    // Ensure we have at least one section
    const firstRow = page.locator("table tbody tr").first();
    const firstCard = page
      .locator('[data-testid*="menu-section-card"]')
      .first();

    if ((await firstRow.isVisible()) || (await firstCard.isVisible())) {
      // Look for duplicate button
      const duplicateButton = page
        .locator('[data-testid*="duplicate-menu-section"]')
        .first()
        .or(page.locator('button[aria-label*="duplicate"]').first())
        .or(page.locator('button:has-text("Duplicate")').first());

      if (await duplicateButton.isVisible()) {
        await duplicateButton.click();

        // Should navigate to create page with pre-filled data
        await expect(page).toHaveURL(/.*menu-sections\/create/);

        // Verify name field has "Copy of" or similar
        const nameInput = page.locator('input[name="sectionName"]');
        const nameValue = await nameInput.inputValue();
        expect(nameValue).toMatch(/copy|duplicate/i);
      }
    }
  });
});
