import { test, expect } from "@playwright/test";
import { login } from "../helpers/auth";

test.describe("Recipe CRUD Operations", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto("/en/restaurant/recipes");
    await page.waitForLoadState("networkidle");
  });

  test("Create new recipe with steps", async ({ page }) => {
    // Navigate to create page
    const createButton = page
      .locator('[data-testid="create-recipe-button"]')
      .or(page.locator('a[href*="recipes/create"]'))
      .or(page.locator('button:has-text("Create")'))
      .first();

    await createButton.click();
    await expect(page).toHaveURL(/.*recipes\/create/);

    // Fill recipe details
    const recipeName = `Test Recipe ${Date.now()}`;
    await page.fill('input[name="recipeName"]', recipeName);

    // Fill description if available
    const descriptionField = page
      .locator('textarea[name="description"]')
      .or(page.locator('textarea[placeholder*="description"]'));
    if (await descriptionField.isVisible()) {
      await descriptionField.fill("A delicious test recipe");
    }

    // Fill prep time and cook time
    await page.fill('input[name="prepTime"]', "15");
    await page.fill('input[name="cookTime"]', "30");

    // Fill servings
    await page.fill('input[name="servings"]', "4");

    // Add recipe step
    const addStepButton = page
      .locator('[data-testid="add-step-button"]')
      .or(page.locator('button:has-text("Add Step")'))
      .first();

    if (await addStepButton.isVisible()) {
      await addStepButton.click();

      // Fill step details
      const stepDescription = page
        .locator('textarea[name*="step"]')
        .or(page.locator('[data-testid="step-description"]'))
        .first();
      await stepDescription.fill("First, prepare all ingredients");

      // Add ingredient to step if possible
      const addIngredientButton = page
        .locator('[data-testid="add-ingredient-to-step"]')
        .or(page.locator('button:has-text("Add Ingredient")'))
        .nth(1); // Second one might be for the step

      if (await addIngredientButton.isVisible()) {
        await addIngredientButton.click();
        // Select first available ingredient
        const ingredientSelect = page
          .locator('select[name*="ingredient"]')
          .first();
        if (await ingredientSelect.isVisible()) {
          await ingredientSelect.selectOption({ index: 1 });
        }
      }
    }

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for redirect
    await expect(page).toHaveURL(/.*recipes(?!\/create)/);
    await page.waitForTimeout(1000);

    // Verify recipe appears
    await expect(page.locator(`text=${recipeName}`)).toBeVisible({
      timeout: 15000,
    });
  });

  test("Edit recipe and update steps", async ({ page }) => {
    // Ensure we have at least one recipe
    const rows = page.locator("table tbody tr");
    const cards = page.locator('[data-testid*="recipe-card"]');

    if ((await rows.count()) === 0 && (await cards.count()) === 0) {
      // Create one first
      const createButton = page
        .locator('[data-testid="create-recipe-button"]')
        .or(page.locator('a[href*="recipes/create"]'))
        .first();
      await createButton.click();
      await page.fill('input[name="recipeName"]', "Recipe to Edit");
      await page.fill('input[name="prepTime"]', "10");
      await page.fill('input[name="cookTime"]', "20");
      await page.fill('input[name="servings"]', "2");
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*recipes(?!\/create)/);
      await page.waitForTimeout(1000);
    }

    // Find edit button
    const editButton = page
      .locator('[data-testid*="edit-recipe"]')
      .first()
      .or(page.locator('button[aria-label*="edit"]').first())
      .or(page.locator('a[href*="recipes/edit"]').first());

    await editButton.click();
    await expect(page).toHaveURL(/.*recipes\/edit\/.*/);

    // Update recipe name
    const nameInput = page.locator('input[name="recipeName"]');
    await nameInput.clear();
    await nameInput.fill("Updated Recipe Name");

    // Update times
    const prepTimeInput = page.locator('input[name="prepTime"]');
    await prepTimeInput.clear();
    await prepTimeInput.fill("20");

    // Submit
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*recipes(?!\/edit)/);

    // Verify update
    await page.waitForTimeout(1000);
    await expect(page.locator("text=Updated Recipe Name")).toBeVisible({
      timeout: 15000,
    });
  });

  test("View recipe details", async ({ page }) => {
    // Ensure we have recipes
    const firstRow = page.locator("table tbody tr").first();
    const firstCard = page.locator('[data-testid*="recipe-card"]').first();

    if (await firstRow.isVisible()) {
      const nameCell = firstRow.locator("td").first();
      await nameCell.click();
    } else if (await firstCard.isVisible()) {
      await firstCard.click();
    }

    // Wait for modal or detail view
    await page.waitForTimeout(500);

    // Check for recipe details
    const hasSteps = await page.locator("text=Steps").isVisible();
    const hasIngredients = await page.locator("text=Ingredients").isVisible();
    const hasPrepTime = await page.locator("text=Prep Time").isVisible();

    expect(hasSteps || hasIngredients || hasPrepTime).toBeTruthy();

    // Close modal if present
    const closeButton = page
      .locator('button[aria-label="Close"]')
      .or(page.locator('button:has-text("Close")'))
      .first();

    if (await closeButton.isVisible()) {
      await closeButton.click();
    }
  });

  test("Search recipes", async ({ page }) => {
    // Find search input
    const searchInput = page
      .locator('[data-testid="recipe-search"]')
      .or(page.locator('input[placeholder*="Search"]'))
      .or(page.locator('input[placeholder*="search"]'))
      .first();

    await searchInput.fill("test");
    await page.waitForTimeout(600); // Debounce

    // Verify search is working
    const hasResults =
      (await page.locator("table tbody tr").count()) > 0 ||
      (await page.locator('[data-testid*="recipe-card"]').count()) > 0;
    const hasNoResults = await page
      .locator("text=/No recipes found/i")
      .isVisible();

    expect(hasResults || hasNoResults).toBeTruthy();
  });

  test("Delete recipe", async ({ page }) => {
    // Create recipe to delete
    const createButton = page
      .locator('[data-testid="create-recipe-button"]')
      .or(page.locator('a[href*="recipes/create"]'))
      .first();
    await createButton.click();

    const deleteTestName = `Delete Recipe ${Date.now()}`;
    await page.fill('input[name="recipeName"]', deleteTestName);
    await page.fill('input[name="prepTime"]', "5");
    await page.fill('input[name="cookTime"]', "10");
    await page.fill('input[name="servings"]', "1");
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*recipes(?!\/create)/);
    await page.waitForTimeout(1000);

    // Find delete button
    const row = page.locator("tr", { hasText: deleteTestName }).or(
      page.locator('[data-testid*="recipe-card"]', {
        hasText: deleteTestName,
      })
    );

    const deleteButton = row
      .locator('[data-testid*="delete-recipe"]')
      .or(row.locator('button[aria-label*="delete"]'))
      .first();

    await deleteButton.click();

    // Confirm deletion
    await page.click('button:has-text("Delete")');
    await page.waitForTimeout(1000);

    // Verify deletion
    await expect(page.locator(`text=${deleteTestName}`)).not.toBeVisible();
  });

  test("Filter recipes by equipment", async ({ page }) => {
    // Open filter panel if available
    const filterButton = page
      .locator('[data-testid="filter-toggle-button"]')
      .or(page.locator('button:has-text("Filter")'))
      .or(page.locator('button:has-text("Show Filters")'))
      .first();

    if (await filterButton.isVisible()) {
      await filterButton.click();
      await page.waitForTimeout(300);

      // Find equipment filters
      const equipmentSection = page
        .locator("text=Equipment")
        .locator("..")
        .or(page.locator('[data-testid="equipment-filters"]'));

      // Select first equipment
      const equipmentCheckbox = equipmentSection
        .locator('input[type="checkbox"]')
        .first();
      if (await equipmentCheckbox.isVisible()) {
        await equipmentCheckbox.check();

        // Apply filters
        await page.click('button:has-text("Apply Filters")');
        await page.waitForTimeout(500);
      }
    }
  });

  test("Sort recipes by cook time", async ({ page }) => {
    const cookTimeHeader = page.locator('th:has-text("Cook Time")');

    if (await cookTimeHeader.isVisible()) {
      // Click to sort
      await cookTimeHeader.click();
      await page.waitForTimeout(500);

      // Verify sort indicator
      const sortIndicator = cookTimeHeader
        .locator("svg")
        .or(cookTimeHeader.locator('[aria-label*="sort"]'));

      await expect(sortIndicator).toBeVisible();
    }
  });

  test("Validate recipe times", async ({ page }) => {
    const createButton = page
      .locator('[data-testid="create-recipe-button"]')
      .or(page.locator('a[href*="recipes/create"]'))
      .first();
    await createButton.click();

    // Test negative time
    await page.fill('input[name="recipeName"]', "Time Test");
    await page.fill('input[name="prepTime"]', "-10");
    await page.click('button[type="submit"]');

    // Should show validation error
    await expect(
      page.locator("text=/positive|greater than|invalid/i")
    ).toBeVisible();

    // Test non-numeric time
    const prepTimeInput = page.locator('input[name="prepTime"]');
    await prepTimeInput.clear();
    await prepTimeInput.fill("abc");
    await page.click('button[type="submit"]');

    // Should show validation error
    await expect(page.locator("text=/number|numeric|invalid/i")).toBeVisible();
  });
});
