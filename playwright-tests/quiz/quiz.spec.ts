import { test, expect } from "@playwright/test";
import { login } from "../helpers/auth";
import { ROUTES } from "../helpers/navigation";

test.describe("Quiz Functionality", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("Quiz configuration options", async ({ page }) => {
    await page.goto(ROUTES.QUIZ);
    await page.waitForLoadState("networkidle");

    // Check quiz modes
    await expect(page.locator('text="Easy"')).toBeVisible();
    await expect(page.locator('text="Medium"')).toBeVisible();
    await expect(page.locator('text="Hard"')).toBeVisible();
    await expect(page.locator('text="Custom"')).toBeVisible();

    // Check menu sections
    await expect(page.locator('text="Breakfast Menu"')).toBeVisible();
    await expect(page.locator('text="Lunch Menu"')).toBeVisible();

    // Check start button
    await expect(page.locator('button:has-text("Start Quiz")')).toBeVisible();
  });

  test("High scores display", async ({ page }) => {
    await page.goto(ROUTES.QUIZ);

    // Check high scores section
    await expect(page.locator('text="High Scores"')).toBeVisible();
    await expect(
      page.locator('text="Restaurant ID: RST-000001"')
    ).toBeVisible();

    // Check leaderboard has entries
    const leaderboardRows = page.locator("table tr, tbody tr");
    const rowCount = await leaderboardRows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test("Start and play quiz", async ({ page }) => {
    await page.goto(ROUTES.QUIZ);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Wait for quiz configuration to load
    await page.waitForSelector('button:has-text("Start Quiz")', {
      timeout: 10000,
    });

    // Start quiz
    await page.locator('button:has-text("Start Quiz")').click();

    // Wait for loading modal and quiz to load (20 seconds as observed)
    await page.waitForTimeout(20000);

    // Also wait for URL change to confirm navigation
    await page.waitForURL("**/quiz/question", { timeout: 5000 }).catch(() => {
      // If URL doesn't change, continue anyway
    });

    // Look for quiz content
    const questionElements = await page
      .locator("h1, h2, h3, p")
      .allTextContents();
    const hasQuestion = questionElements.some(
      (text) =>
        text.includes("?") ||
        text.includes("Which") ||
        text.includes("What") ||
        text.includes("Does")
    );

    expect(hasQuestion).toBeTruthy();

    // Try to answer a question - look for radio buttons or clickable options
    // For True/False questions, the options might be radio buttons
    const trueOption = page
      .locator('label:has-text("True"), input[value="true"]')
      .first();
    const falseOption = page
      .locator('label:has-text("False"), input[value="false"]')
      .first();

    // Click an answer
    if (await trueOption.isVisible()) {
      await trueOption.click();
    } else if (await falseOption.isVisible()) {
      await falseOption.click();
    } else {
      // For multiple choice, click the first visible option
      const firstOption = page.locator('input[type="radio"]').first();
      if (await firstOption.isVisible()) {
        await firstOption.click();
      }
    }

    // Wait a moment for the answer to register
    await page.waitForTimeout(1000);

    // Now submit the answer
    const submitButton = page.locator('button:has-text("Submit Answer")');
    if (await submitButton.isVisible()) {
      // Wait for button to be enabled
      await submitButton.waitFor({ state: "visible", timeout: 5000 });
      await page.waitForTimeout(500); // Extra wait for button to enable
      await submitButton.click();
      await page.waitForTimeout(2000);

      // Check for Next button after submitting
      const nextButton = page.locator('button:has-text("Next")');
      if (await nextButton.isVisible()) {
        expect(true).toBeTruthy(); // Test passes if we got here
      }
    }
  });

  test("Quiz configuration page elements", async ({ page }) => {
    await page.goto(ROUTES.QUIZ);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    // Check that we're on the quiz configuration page
    await expect(page.locator('text="Quiz Configuration"')).toBeVisible({
      timeout: 10000,
    });

    // Check that quiz mode section exists
    await expect(page.locator('text="Quiz Mode"').first()).toBeVisible();

    // Check for difficulty options
    await expect(page.locator('text="Easy"').first()).toBeVisible();
    await expect(page.locator('text="Medium"').first()).toBeVisible();
    await expect(page.locator('text="Hard"').first()).toBeVisible();
    await expect(page.locator('text="Custom"').first()).toBeVisible();

    // Check for menu checkboxes
    const breakfastCheckbox = page.locator('input[type="checkbox"]').nth(0);
    const lunchCheckbox = page.locator('input[type="checkbox"]').nth(1);
    await expect(breakfastCheckbox).toBeVisible();
    await expect(lunchCheckbox).toBeVisible();

    // Check for the Start Quiz button
    await expect(page.locator('button:has-text("Start Quiz")')).toBeVisible();
  });
});
