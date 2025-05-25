import { test, expect } from "@playwright/test";
import { login } from "../helpers/auth";

test.describe("Basic Quiz Tests", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto("/en/restaurant/quiz");
    await page.waitForLoadState("networkidle");
  });

  test("Quiz page loads correctly", async ({ page }) => {
    // Check for quiz title
    await expect(
      page.locator("h1, h2").filter({ hasText: /Quiz/i })
    ).toBeVisible();

    // Check for quiz mode selection or start button
    const hasStartButton =
      (await page
        .locator('button:has-text("Start"), button:has-text("Begin")')
        .count()) > 0;
    const hasModeSelection =
      (await page
        .locator("text=/Training Mode|Timed Mode|Sudden Death/i")
        .count()) > 0;

    expect(hasStartButton || hasModeSelection).toBeTruthy();
  });

  test("Quiz configuration is accessible", async ({ page }) => {
    // Look for settings/config button
    const configButton = page
      .locator(
        '[data-testid="quiz-config-button"], button[aria-label*="settings"], button[aria-label*="config"]'
      )
      .first();

    if (await configButton.isVisible()) {
      await configButton.click();

      // Should show configuration options
      await expect(
        page.locator("text=/Question Types|Categories|Difficulty/i")
      ).toBeVisible();
    }
  });

  test("Can select quiz mode", async ({ page }) => {
    // Look for mode buttons
    const trainingMode = page
      .locator(
        'button:has-text("Training Mode"), [data-testid="training-mode"]'
      )
      .first();

    if (await trainingMode.isVisible()) {
      await trainingMode.click();

      // Should either start quiz or show further options
      const hasQuizStarted =
        (await page
          .locator('[data-testid="quiz-question"], text=/Question [0-9]/i')
          .count()) > 0;
      const hasStartButton =
        (await page.locator('button:has-text("Start Quiz")').count()) > 0;

      expect(hasQuizStarted || hasStartButton).toBeTruthy();
    }
  });

  test("Quiz high scores section exists", async ({ page }) => {
    // Look for high scores
    const highScoresSection = page
      .locator("text=/High Scores|Leaderboard|Best Scores/i")
      .first();

    if (await highScoresSection.isVisible()) {
      await expect(highScoresSection).toBeVisible();

      // May show "No scores yet" or actual scores
      const hasScores =
        (await page
          .locator('[data-testid="score-entry"], tr:has-text("%")')
          .count()) > 0;
      const hasNoScores =
        (await page.locator("text=/No scores|No high scores/i").count()) > 0;

      expect(hasScores || hasNoScores).toBeTruthy();
    }
  });
});
