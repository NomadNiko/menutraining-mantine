import { test, expect } from "@playwright/test";
import { login } from "../helpers/auth";

test.describe("Menu CRUD Operations", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto("/en/restaurant/menus");
    await page.waitForLoadState("networkidle");
  });

  test("Create new menu with sections", async ({ page }) => {
    // Navigate to create page
    const createButton = page
      .locator('[data-testid="create-menu-button"]')
      .or(page.locator('a[href*="menus/create"]'))
      .or(page.locator('button:has-text("Create")'))
      .first();

    await createButton.click();
    await expect(page).toHaveURL(/.*menus\/create/);

    // Fill menu details
    const menuName = `Test Menu ${Date.now()}`;
    await page.fill('input[name="menuName"]', menuName);

    // Fill description
    const descriptionField = page
      .locator('textarea[name="description"]')
      .or(page.locator('textarea[placeholder*="description"]'));
    if (await descriptionField.isVisible()) {
      await descriptionField.fill("Test menu for automated testing");
    }

    // Set menu as active
    const activeToggle = page
      .locator('input[name="isActive"]')
      .or(page.locator('[data-testid="active-toggle"]'));
    if (await activeToggle.isVisible()) {
      await activeToggle.check();
    }

    // Add menu sections
    const addSectionsButton = page
      .locator('[data-testid="add-menu-sections-button"]')
      .or(page.locator('button:has-text("Add Sections")'))
      .or(page.locator('button:has-text("Select Sections")'))
      .first();

    if (await addSectionsButton.isVisible()) {
      await addSectionsButton.click();

      // Wait for modal or panel
      await page.waitForTimeout(500);

      // Select first few sections
      const sectionCheckboxes = page
        .locator('input[type="checkbox"][name*="section"]')
        .or(page.locator('[data-testid*="menu-section-checkbox"]'));

      const count = await sectionCheckboxes.count();
      if (count > 0) {
        // Select up to 3 sections
        for (let i = 0; i < Math.min(3, count); i++) {
          await sectionCheckboxes.nth(i).check();
        }
      }

      // Apply selection
      const applyButton = page
        .locator('[data-testid="apply-sections-button"]')
        .or(page.locator('button:has-text("Apply")'))
        .or(page.locator('button:has-text("Done")'))
        .first();
      await applyButton.click();
    }

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for redirect
    await expect(page).toHaveURL(/.*menus(?!\/create)/);
    await page.waitForTimeout(1000);

    // Verify menu appears
    await expect(page.locator(`text=${menuName}`)).toBeVisible({
      timeout: 15000,
    });
  });

  test("Edit menu and toggle active status", async ({ page }) => {
    // Ensure we have at least one menu
    const rows = page.locator("table tbody tr");
    const cards = page.locator('[data-testid*="menu-card"]');

    if ((await rows.count()) === 0 && (await cards.count()) === 0) {
      // Create one first
      const createButton = page
        .locator('[data-testid="create-menu-button"]')
        .or(page.locator('a[href*="menus/create"]'))
        .first();
      await createButton.click();
      await page.fill('input[name="menuName"]', "Menu to Edit");
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*menus(?!\/create)/);
      await page.waitForTimeout(1000);
    }

    // Find edit button
    const editButton = page
      .locator('[data-testid*="edit-menu"]')
      .first()
      .or(page.locator('button[aria-label*="edit"]').first())
      .or(page.locator('a[href*="menus/edit"]').first());

    await editButton.click();
    await expect(page).toHaveURL(/.*menus\/edit\/.*/);

    // Update menu name
    const nameInput = page.locator('input[name="menuName"]');
    await nameInput.clear();
    await nameInput.fill("Updated Menu Name");

    // Toggle active status
    const activeToggle = page
      .locator('input[name="isActive"]')
      .or(page.locator('[data-testid="active-toggle"]'));
    if (await activeToggle.isVisible()) {
      await activeToggle.click();
    }

    // Submit
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*menus(?!\/edit)/);

    // Verify update
    await page.waitForTimeout(1000);
    await expect(page.locator("text=Updated Menu Name")).toBeVisible({
      timeout: 15000,
    });
  });

  test("View menu details with sections", async ({ page }) => {
    // Ensure we have menus
    const firstRow = page.locator("table tbody tr").first();
    const firstCard = page.locator('[data-testid*="menu-card"]').first();

    if (await firstRow.isVisible()) {
      const nameCell = firstRow.locator("td").first();
      await nameCell.click();
    } else if (await firstCard.isVisible()) {
      await firstCard.click();
    }

    // Wait for modal or detail view
    await page.waitForTimeout(500);

    // Check for menu details
    const hasSections = await page.locator("text=Menu Sections").isVisible();
    const hasStatus = await page.locator("text=Active").isVisible();
    const hasDescription = await page.locator("text=Description").isVisible();

    expect(hasSections || hasStatus || hasDescription).toBeTruthy();

    // Close modal if present
    const closeButton = page
      .locator('button[aria-label="Close"]')
      .or(page.locator('button:has-text("Close")'))
      .first();

    if (await closeButton.isVisible()) {
      await closeButton.click();
    }
  });

  test("Filter menus by active status", async ({ page }) => {
    // Look for active/inactive filter
    const statusFilter = page
      .locator('[data-testid="status-filter"]')
      .or(page.locator('select[name="status"]'))
      .or(page.locator('button:has-text("Active")'))
      .first();

    if (await statusFilter.isVisible()) {
      // If it's a select
      if (statusFilter.locator === "select") {
        await statusFilter.selectOption("active");
      } else {
        // If it's a button/toggle
        await statusFilter.click();
      }

      await page.waitForTimeout(500);

      // Verify filtered results
      const badges = page.locator('[data-testid="status-badge"]');
      if ((await badges.count()) > 0) {
        const firstBadgeText = await badges.first().textContent();
        expect(firstBadgeText).toMatch(/active/i);
      }
    }
  });

  test("Delete menu", async ({ page }) => {
    // Create menu to delete
    const createButton = page
      .locator('[data-testid="create-menu-button"]')
      .or(page.locator('a[href*="menus/create"]'))
      .first();
    await createButton.click();

    const deleteTestName = `Delete Menu ${Date.now()}`;
    await page.fill('input[name="menuName"]', deleteTestName);
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*menus(?!\/create)/);
    await page.waitForTimeout(1000);

    // Find delete button
    const row = page.locator("tr", { hasText: deleteTestName }).or(
      page.locator('[data-testid*="menu-card"]', {
        hasText: deleteTestName,
      })
    );

    const deleteButton = row
      .locator('[data-testid*="delete-menu"]')
      .or(row.locator('button[aria-label*="delete"]'))
      .first();

    await deleteButton.click();

    // Confirm deletion
    await page.click('button:has-text("Delete")');
    await page.waitForTimeout(1000);

    // Verify deletion
    await expect(page.locator(`text=${deleteTestName}`)).not.toBeVisible();
  });

  test("Duplicate menu", async ({ page }) => {
    // Ensure we have at least one menu
    const firstRow = page.locator("table tbody tr").first();
    const firstCard = page.locator('[data-testid*="menu-card"]').first();

    if ((await firstRow.isVisible()) || (await firstCard.isVisible())) {
      // Look for duplicate button
      const duplicateButton = page
        .locator('[data-testid*="duplicate-menu"]')
        .first()
        .or(page.locator('button[aria-label*="duplicate"]').first())
        .or(page.locator('button:has-text("Duplicate")').first());

      if (await duplicateButton.isVisible()) {
        await duplicateButton.click();

        // Should navigate to create page with pre-filled data
        await expect(page).toHaveURL(/.*menus\/create/);

        // Verify name field has "Copy of" or similar
        const nameInput = page.locator('input[name="menuName"]');
        const nameValue = await nameInput.inputValue();
        expect(nameValue).toMatch(/copy|duplicate/i);
      }
    }
  });

  test("Sort menus by name", async ({ page }) => {
    const nameHeader = page
      .locator('th:has-text("Name")')
      .or(page.locator('th:has-text("Menu Name")'));

    if (await nameHeader.isVisible()) {
      // Get initial first name
      const firstNameBefore = await page
        .locator("table tbody tr")
        .first()
        .locator("td")
        .first()
        .textContent();

      // Click to sort
      await nameHeader.click();
      await page.waitForTimeout(500);

      // Get new first name
      const firstNameAfter = await page
        .locator("table tbody tr")
        .first()
        .locator("td")
        .first()
        .textContent();

      // Names should be different if there are multiple menus
      const rowCount = await page.locator("table tbody tr").count();
      if (rowCount > 1) {
        expect(firstNameBefore).not.toBe(firstNameAfter);
      }
    }
  });

  test("Preview menu", async ({ page }) => {
    // Ensure we have menus
    const firstRow = page.locator("table tbody tr").first();
    const firstCard = page.locator('[data-testid*="menu-card"]').first();

    if ((await firstRow.isVisible()) || (await firstCard.isVisible())) {
      // Look for preview button
      const previewButton = page
        .locator('[data-testid*="preview-menu"]')
        .first()
        .or(page.locator('button[aria-label*="preview"]').first())
        .or(page.locator('button:has-text("Preview")').first());

      if (await previewButton.isVisible()) {
        await previewButton.click();

        // Should open preview modal or new tab
        await page.waitForTimeout(1000);

        // Check for preview elements
        const hasMenuTitle = await page.locator("h1, h2").first().isVisible();
        const hasSections = (await page.locator("h3, h4").count()) > 0;

        expect(hasMenuTitle || hasSections).toBeTruthy();
      }
    }
  });
});
