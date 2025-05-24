import { test, expect } from "@playwright/test";

test.describe("Menu Training Application Demo", () => {
  test("Complete application walkthrough", async ({ page }) => {
    // 1. Login
    await test.step("Authentication", async () => {
      await page.goto("/en/sign-in");
      await page.fill('input[type="email"]', "aloha@ixplor.app");
      await page.fill('input[type="password"]', "password");
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);

      // Verify we're logged in
      await expect(page).toHaveURL(/\/en$/);
    });

    // 2. Check restaurant data
    await test.step("Verify restaurant data is loaded", async () => {
      // Check ingredients
      await page.goto("/en/restaurant/ingredients");
      await page.waitForLoadState("networkidle");
      const ingredientElements = await page
        .locator('tr, [class*="card"]')
        .count();
      expect(ingredientElements).toBeGreaterThan(0);

      // Check menu items
      await page.goto("/en/restaurant/menu-items");
      await page.waitForLoadState("networkidle");
      const menuItemElements = await page
        .locator('tr, [class*="card"]')
        .count();
      expect(menuItemElements).toBeGreaterThan(0);
    });

    // 3. Test Quiz functionality
    await test.step("Quiz system", async () => {
      await page.goto("/en/restaurant/quiz");
      await page.waitForLoadState("networkidle");

      // Verify quiz configuration page
      await expect(page.locator("h1, h2").first()).toContainText(
        "Menu Training Quiz"
      );

      // Check for menu sections
      const breakfastCheckbox = page.locator('text="Breakfast Menu"');
      const lunchCheckbox = page.locator('text="Lunch Menu"');
      await expect(breakfastCheckbox).toBeVisible();
      await expect(lunchCheckbox).toBeVisible();

      // Verify Start Quiz button
      const startButton = page.locator('button:has-text("Start Quiz")');
      await expect(startButton).toBeVisible();

      // Check high scores table
      const highScoresSection = page.locator('text="High Scores"');
      await expect(highScoresSection).toBeVisible();
    });

    // 4. Take screenshots for documentation
    await test.step("Documentation screenshots", async () => {
      // Quiz configuration page
      await page.goto("/en/restaurant/quiz");
      await page.screenshot({
        path: "playwright-tests/screenshots/quiz-config.png",
        fullPage: true,
      });

      // Ingredients page
      await page.goto("/en/restaurant/ingredients");
      await page.screenshot({
        path: "playwright-tests/screenshots/ingredients.png",
        fullPage: true,
      });

      // Menu items page
      await page.goto("/en/restaurant/menu-items");
      await page.screenshot({
        path: "playwright-tests/screenshots/menu-items.png",
        fullPage: true,
      });
    });
  });

  test("Quiz gameplay", async ({ page }) => {
    // Login first
    await page.goto("/en/sign-in");
    await page.fill('input[type="email"]', "aloha@ixplor.app");
    await page.fill('input[type="password"]', "password");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Navigate to quiz
    await page.goto("/en/restaurant/quiz");
    await page.waitForLoadState("networkidle");

    // Start quiz
    const startButton = page.locator('button:has-text("Start Quiz")');
    await startButton.click();

    // Wait for loading modal to complete and quiz to load (20 seconds)
    await page.waitForTimeout(20000);

    // Wait for navigation to quiz question page
    await page.waitForURL("**/quiz/question", { timeout: 5000 }).catch(() => {
      console.log("Quiz navigation took longer than expected");
    });

    // Check if we're on the quiz question page
    const currentUrl = page.url();
    if (currentUrl.includes("/quiz/question")) {
      // Look for quiz elements
      const questionText = await page.locator("h1, h2, h3").allTextContents();
      const question = questionText.find(
        (text) =>
          text.includes("?") ||
          text.includes("contain") ||
          text.includes("Which")
      );

      if (question) {
        console.log(`Quiz question: "${question}"`);

        // For True/False questions
        const trueOption = page.locator('text="True"').first();
        if (await trueOption.isVisible()) {
          await trueOption.click();

          // Submit answer
          const submitButton = page.locator('button:has-text("Submit Answer")');
          if (await submitButton.isVisible()) {
            await submitButton.click();
            await page.waitForTimeout(2000);
          }
        }
      }

      // Take screenshot of quiz in progress
      await page.screenshot({
        path: "playwright-tests/screenshots/quiz-question.png",
      });
    }
  });
});

test.describe("User permissions and navigation", () => {
  test("User can access restaurant features", async ({ page }) => {
    // Login
    await page.goto("/en/sign-in");
    await page.fill('input[type="email"]', "aloha@ixplor.app");
    await page.fill('input[type="password"]', "password");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Check navigation menu
    const foodMenu = page.locator('text="Food"').first();
    const menuMenu = page.locator('text="Menu"').first();

    await expect(foodMenu).toBeVisible();
    await expect(menuMenu).toBeVisible();

    // Verify restaurant context (Nikos Place)
    const restaurantName = page.locator('text="Nikos Place"');
    await expect(restaurantName).toBeVisible();

    // Check accessible pages
    const pages = [
      { url: "/en/restaurant/ingredients", title: "Ingredients" },
      { url: "/en/restaurant/recipes", title: "Recipes" },
      { url: "/en/restaurant/menu-items", title: "Menu Items" },
      { url: "/en/restaurant/menu-sections", title: "Menu Sections" },
      { url: "/en/restaurant/menus", title: "Menus" },
      { url: "/en/restaurant/quiz", title: "Quiz" },
    ];

    for (const { url } of pages) {
      await page.goto(url);
      await page.waitForLoadState("networkidle");
      // Page should load without redirecting to sign-in
      await expect(page).not.toHaveURL(/sign-in/);
    }
  });
});
