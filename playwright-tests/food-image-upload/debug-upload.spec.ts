import { test } from "@playwright/test";

test("debug food image upload", async ({ page }) => {
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

  // Take screenshot of the whole page
  await page.screenshot({ path: "food-upload-page.png", fullPage: true });

  // Find the upload area
  const uploadArea = page
    .locator('[data-testid="ingredient-image"]')
    .locator("..");

  // Take screenshot of just the upload area
  await uploadArea.screenshot({ path: "food-upload-area.png" });

  // Log the inner text
  const innerText = await uploadArea.innerText();
  console.log("Upload area text:", innerText);

  // Log the HTML
  const innerHTML = await uploadArea.innerHTML();
  console.log("Upload area HTML:", innerHTML.substring(0, 500));
});
