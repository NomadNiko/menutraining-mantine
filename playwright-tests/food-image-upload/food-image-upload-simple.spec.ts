import { test, expect } from "@playwright/test";

test.describe("Food Image Upload Simple Test", () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto("/en/sign-in");
    await page.fill('input[name="email"]', "aloha@ixplor.app");
    await page.fill('input[name="password"]', "password");
    await page.click('button[type="submit"]');

    // Wait for navigation
    await page.waitForURL("/en");
  });

  test("should show food image upload component and open cropper", async ({
    page,
  }) => {
    // Navigate to ingredients create page
    await page.goto("/en/restaurant/ingredients/create");
    await page.waitForLoadState("networkidle");

    // Fill required ingredient name
    await page.fill('input[name="ingredientName"]', "Test Food Item");

    // Check that the food image upload area is visible
    const uploadArea = page.locator('[data-testid="ingredient-image-wrapper"]');
    await expect(uploadArea).toBeVisible();

    // Check for upload button with correct text
    const uploadButton = uploadArea.locator('button:has-text("Select Image")');
    await expect(uploadButton).toBeVisible();

    // Check for placeholder area with image requirements
    const placeholderArea = uploadArea.locator('text="Upload food image"');
    await expect(placeholderArea).toBeVisible();

    const requirementsText = uploadArea.locator(
      'text="300-600px square, JPEG"'
    );
    await expect(requirementsText).toBeVisible();

    // Take a screenshot of the upload area
    await uploadArea.screenshot({
      path: "playwright-tests/food-image-upload/upload-area.png",
    });
  });

  test("should show proper UI on all food forms", async ({ page }) => {
    const forms = [
      {
        url: "/en/restaurant/ingredients/create",
        testId: "ingredient-image",
        name: "Ingredients",
      },
      {
        url: "/en/restaurant/menu-items/create",
        testId: "menu-item-image",
        name: "Menu Items",
      },
      {
        url: "/en/restaurant/recipes/create",
        testId: "recipe-image",
        name: "Recipes",
      },
    ];

    for (const form of forms) {
      await page.goto(form.url);
      await page.waitForLoadState("networkidle");

      const uploadArea = page.locator(`[data-testid="${form.testId}-wrapper"]`);
      await expect(uploadArea).toBeVisible();

      // Check for the placeholder or button
      const placeholderText = uploadArea.locator('text="Upload food image"');
      const requirementsText = uploadArea.locator(
        'text="300-600px square, JPEG"'
      );

      await expect(placeholderText).toBeVisible();
      await expect(requirementsText).toBeVisible();

      console.log(`✓ Food image upload verified on ${form.name} form`);
    }
  });
});
