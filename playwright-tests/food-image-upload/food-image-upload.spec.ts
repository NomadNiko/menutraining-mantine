import { test, expect } from "@playwright/test";
import path from "path";

test.describe("Food Image Upload", () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto("/en/sign-in");
    await page.fill('input[name="email"]', "aloha@ixplor.app");
    await page.fill('input[name="password"]', "password");
    await page.click('button[type="submit"]');

    // Wait for navigation
    await page.waitForURL("/en");

    // Navigate to ingredients create page
    await page.goto("/en/restaurant/ingredients/create");
    await page.waitForLoadState("networkidle");
  });

  test("should show food image upload component with proper UI", async ({
    page,
  }) => {
    // Check that the food image upload area is visible
    const uploadArea = page
      .locator('[data-testid="ingredient-image"]')
      .locator("..");
    await expect(uploadArea).toBeVisible();

    // Check for upload button
    const uploadButton = uploadArea.locator('button:has-text("Select Image")');
    await expect(uploadButton).toBeVisible();

    // Check for placeholder text
    await expect(uploadArea).toContainText("Upload food image");
    await expect(uploadArea).toContainText("300-600px square, JPEG");
  });

  test("should open cropper modal when image is selected", async ({ page }) => {
    // Create a test image file path
    const testImagePath = path.join(__dirname, "test-food-image.jpg");

    // Skip image creation in CI - use existing test image
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fs = require("fs");
    if (!fs.existsSync(testImagePath)) {
      // If test image doesn't exist, skip the test
      test.skip();
      return;
    }

    // Upload the image
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testImagePath);

    // Wait for cropper modal to appear
    await expect(
      page.locator('.mantine-Modal-title:has-text("Crop Food Image")')
    ).toBeVisible({ timeout: 5000 });

    // Check that the cropper is visible
    const cropperContainer = page.locator(".reactEasyCrop_Container");
    await expect(cropperContainer).toBeVisible();

    // Check for zoom slider
    await expect(page.locator('text="Zoom:"')).toBeVisible();
    const zoomSlider = page.locator(".mantine-Slider-root").first();
    await expect(zoomSlider).toBeVisible();

    // Check for rotation slider
    await expect(page.locator('text="Rotation:"')).toBeVisible();
    const rotationSlider = page.locator(".mantine-Slider-root").nth(1);
    await expect(rotationSlider).toBeVisible();

    // Check for action buttons
    await expect(page.locator('button:has-text("Reset")')).toBeVisible();
    await expect(page.locator('button:has-text("Cancel")')).toBeVisible();
    await expect(page.locator('button:has-text("Crop & Save")')).toBeVisible();
  });

  test("should allow image manipulation and cropping", async ({ page }) => {
    // Upload test image
    const testImagePath = path.join(__dirname, "test-food-image.jpg");
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testImagePath);

    // Wait for modal
    await page.waitForSelector(
      '.mantine-Modal-title:has-text("Crop Food Image")'
    );

    // Test zoom functionality
    const zoomSlider = page.locator(".mantine-Slider-root").first();
    // const zoomThumb = zoomSlider.locator(".mantine-Slider-thumb");

    // Drag zoom slider to increase zoom
    const zoomBox = await zoomSlider.boundingBox();
    if (zoomBox) {
      await page.mouse.move(
        zoomBox.x + zoomBox.width / 2,
        zoomBox.y + zoomBox.height / 2
      );
      await page.mouse.down();
      await page.mouse.move(
        zoomBox.x + zoomBox.width * 0.75,
        zoomBox.y + zoomBox.height / 2
      );
      await page.mouse.up();
    }

    // Verify zoom value changed
    await expect(page.locator("text=/Zoom:\\s*\\d+%/")).toBeVisible();

    // Test rotation functionality
    const rotationSlider = page.locator(".mantine-Slider-root").nth(1);
    const rotationBox = await rotationSlider.boundingBox();
    if (rotationBox) {
      await page.mouse.move(
        rotationBox.x + rotationBox.width / 4,
        rotationBox.y + rotationBox.height / 2
      );
      await page.mouse.down();
      await page.mouse.move(
        rotationBox.x + rotationBox.width / 2,
        rotationBox.y + rotationBox.height / 2
      );
      await page.mouse.up();
    }

    // Test reset button
    await page.click('button:has-text("Reset")');
    await expect(page.locator('text="Zoom: 100%"')).toBeVisible();
    await expect(page.locator('text="Rotation: 0°"')).toBeVisible();

    // Test crop and save
    await page.click('button:has-text("Crop & Save")');

    // Wait for modal to close
    await expect(
      page.locator('.mantine-Modal-title:has-text("Crop Food Image")')
    ).not.toBeVisible({ timeout: 5000 });

    // Verify image was uploaded (should show in preview)
    const imagePreview = page
      .locator('[data-testid="ingredient-image"]')
      .locator("..")
      .locator("img");
    await expect(imagePreview).toBeVisible();

    // Verify the change image button appears
    await expect(page.locator('button:has-text("Change Image")')).toBeVisible();
  });

  test("should validate image dimensions", async ({ page }) => {
    // Create a small test image (200x200) - too small
    const smallImagePath = path.join(__dirname, "test-small-image.jpg");
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fs = require("fs");

    if (!fs.existsSync(smallImagePath)) {
      // Skip if can't create test image
      test.skip();
      return;
    }

    // Try to upload the small image
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(smallImagePath);

    // Should show error message
    await expect(
      page.locator('text="Image is too small. Minimum size is 300x300 pixels."')
    ).toBeVisible({ timeout: 5000 });

    // Modal should not open
    await expect(
      page.locator('.mantine-Modal-title:has-text("Crop Food Image")')
    ).not.toBeVisible();
  });

  test("should handle drag and drop upload", async ({ page }) => {
    const uploadArea = page
      .locator('[data-testid="ingredient-image"]')
      .locator("..");

    // Create test file data
    // const testImagePath = path.join(__dirname, "test-food-image.jpg");
    // const fs = require("fs");

    // Simulate drag over
    await uploadArea.dispatchEvent("dragenter", {
      dataTransfer: {
        items: [{ kind: "file", type: "image/jpeg" }],
        types: ["Files"],
      },
    });

    // Check if drag state is active (border should change)
    const borderStyle = await uploadArea.evaluate(
      (el) => window.getComputedStyle(el).border
    );
    expect(borderStyle).toContain("dashed");

    // Check for drop zone text
    await expect(
      uploadArea.locator('text="Drop your image here"')
    ).toBeVisible();
  });

  test("should work on menu items and recipes forms too", async ({ page }) => {
    // Test on menu items form
    await page.goto("/en/restaurant/menu-items/create");
    await page.waitForLoadState("networkidle");

    const menuItemUpload = page
      .locator('[data-testid="menu-item-image"]')
      .locator("..");
    await expect(menuItemUpload).toBeVisible();
    await expect(menuItemUpload).toContainText("Upload food image");

    // Test on recipes form
    await page.goto("/en/restaurant/recipes/create");
    await page.waitForLoadState("networkidle");

    const recipeUpload = page
      .locator('[data-testid="recipe-image"]')
      .locator("..");
    await expect(recipeUpload).toBeVisible();
    await expect(recipeUpload).toContainText("Upload food image");
  });
});

// Clean up test images after tests
test.afterAll(async () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const fs = require("fs");
  const testImages = [
    path.join(__dirname, "test-food-image.jpg"),
    path.join(__dirname, "test-small-image.jpg"),
  ];

  testImages.forEach((imagePath) => {
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
  });
});
