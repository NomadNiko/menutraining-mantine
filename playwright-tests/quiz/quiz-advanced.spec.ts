import { test, expect } from "@playwright/test";
import { login } from "../helpers/auth";

test.describe("Advanced Quiz Functionality", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto("/en/restaurant/quiz");
    await page.waitForLoadState("networkidle");
  });

  test("All quiz modes functionality", async ({ page }) => {
    // Test each quiz mode
    const modes = [
      { name: "Training Mode", hasTimer: false, hasLives: false },
      { name: "Timed Mode", hasTimer: true, hasLives: false },
      { name: "Sudden Death", hasTimer: false, hasLives: true },
      { name: "Custom Mode", hasTimer: true, hasLives: true },
    ];

    for (const mode of modes) {
      await page.click(`text=${mode.name}`);

      // Configure if custom mode
      if (mode.name === "Custom Mode") {
        await page.fill('input[name="questionCount"]', "10");
        await page.fill('input[name="timePerQuestion"]', "30");
        await page.check('input[name="enableTimer"]');
        await page.check('input[name="enableLives"]');
        await page.fill('input[name="lives"]', "3");
      }

      // Select question types
      await page.check('input[value="single-ingredient"]');
      await page.check('input[value="ingredients-in-dish"]');
      await page.check('input[value="menu-item-contains-allergy"]');

      // Start quiz
      await page.click('button:has-text("Start Quiz")');
      await page.waitForURL("**/restaurant/quiz/question");

      // Verify timer presence
      if (mode.hasTimer) {
        await expect(page.locator('[data-testid="quiz-timer"]')).toBeVisible();
      }

      // Verify lives indicator
      if (mode.hasLives) {
        await expect(page.locator('[data-testid="quiz-lives"]')).toBeVisible();
      }

      // Answer one question
      const firstAnswer = page
        .locator('[data-testid^="answer-option-"]')
        .first();
      await firstAnswer.click();

      // Go back to config
      await page.goto("/en/restaurant/quiz");
    }
  });

  test("Question type coverage", async ({ page }) => {
    const questionTypes = [
      "single-ingredient",
      "ingredients-in-dish",
      "ingredient-contains-allergy",
      "ingredients-with-allergy",
      "menu-item-contains-allergy",
      "menu-item-contains-ingredient",
      "which-menu-item-is-this",
    ];

    // Select training mode for easier testing
    await page.click("text=Training Mode");

    // Test each question type individually
    for (const questionType of questionTypes) {
      // Uncheck all first
      const allCheckboxes = page.locator(
        'input[type="checkbox"][name="questionTypes"]'
      );
      const count = await allCheckboxes.count();
      for (let i = 0; i < count; i++) {
        await allCheckboxes.nth(i).uncheck();
      }

      // Check only this type
      await page.check(`input[value="${questionType}"]`);

      // Start quiz
      await page.click('button:has-text("Start Quiz")');

      // Wait for question
      await page.waitForSelector('[data-testid="quiz-question"]');

      // Verify question loaded
      const questionText = await page
        .locator('[data-testid="quiz-question"]')
        .textContent();
      expect(questionText).toBeTruthy();

      // Answer and continue
      const answer = page.locator('[data-testid^="answer-option-"]').first();
      await answer.click();

      // Go back
      await page.goto("/en/restaurant/quiz");
    }
  });

  test("Quiz interruption and resume", async ({ page }) => {
    // Start a quiz
    await page.click("text=Timed Mode");
    await page.check('input[value="single-ingredient"]');
    await page.click('button:has-text("Start Quiz")');

    // Answer a few questions
    for (let i = 0; i < 3; i++) {
      await page.waitForSelector('[data-testid^="answer-option-"]');
      await page.locator('[data-testid^="answer-option-"]').first().click();
      await page.waitForTimeout(500);
    }

    // Navigate away
    await page.goto("/en/restaurant/ingredients");
    await page.waitForLoadState("networkidle");

    // Come back to quiz
    await page.goto("/en/restaurant/quiz");

    // Should see resume option or start fresh
    const resumeButton = page.locator('button:has-text("Resume Quiz")');
    const startButton = page.locator('button:has-text("Start Quiz")');

    await expect(resumeButton.or(startButton)).toBeVisible();
  });

  test("Quiz timer functionality", async ({ page }) => {
    // Start timed quiz
    await page.click("text=Timed Mode");
    await page.check('input[value="single-ingredient"]');
    await page.click('button:has-text("Start Quiz")');

    // Wait for timer
    await page.waitForSelector('[data-testid="quiz-timer"]');

    // Get initial time
    const initialTime = await page
      .locator('[data-testid="quiz-timer"]')
      .textContent();

    // Wait a bit
    await page.waitForTimeout(2000);

    // Check time decreased
    const currentTime = await page
      .locator('[data-testid="quiz-timer"]')
      .textContent();
    expect(initialTime).not.toBe(currentTime);

    // Let timer run out (if reasonable time)
    const timeMatch = currentTime?.match(/(\d+)/);
    if (timeMatch && parseInt(timeMatch[1]) <= 5) {
      // Wait for timeout
      await page.waitForTimeout(6000);

      // Should auto-advance or show timeout message
      const timeoutMessage = page.locator("text=Time's up!");
      const nextQuestion = page.locator('[data-testid="quiz-question"]');

      await expect(timeoutMessage.or(nextQuestion)).toBeVisible();
    } else {
      // Answer before timeout
      await page.locator('[data-testid^="answer-option-"]').first().click();
    }
  });

  test("Sudden death mode", async ({ page }) => {
    await page.click("text=Sudden Death");
    await page.check('input[value="single-ingredient"]');
    await page.click('button:has-text("Start Quiz")');

    // Look for lives indicator
    await expect(page.locator('[data-testid="quiz-lives"]')).toBeVisible();

    // Intentionally get wrong answers
    let wrongAnswers = 0;
    while (wrongAnswers < 3) {
      await page.waitForSelector('[data-testid^="answer-option-"]');

      // Try to pick wrong answer (last option often wrong in quizzes)
      const options = page.locator('[data-testid^="answer-option-"]');
      const count = await options.count();
      await options.nth(count - 1).click();

      await page.waitForTimeout(1000);

      // Check if quiz ended
      if (await page.url().includes("results")) {
        break;
      }

      wrongAnswers++;
    }

    // Should be at results page after losing all lives
    await expect(page).toHaveURL(/.*quiz\/results/);
  });

  test("High score tracking", async ({ page }) => {
    // Complete a quiz
    await page.click("text=Training Mode");
    await page.check('input[value="single-ingredient"]');
    await page.fill('input[name="questionCount"]', "5");
    await page.click('button:has-text("Start Quiz")');

    // Answer all questions
    for (let i = 0; i < 5; i++) {
      await page.waitForSelector('[data-testid^="answer-option-"]');
      await page.locator('[data-testid^="answer-option-"]').first().click();
      await page.waitForTimeout(500);
    }

    // Should be at results
    await expect(page).toHaveURL(/.*quiz\/results/);

    // Check score display
    await expect(page.locator('[data-testid="quiz-score"]')).toBeVisible();
    await expect(page.locator('[data-testid="quiz-percentage"]')).toBeVisible();

    // Go to high scores
    await page.click('button:has-text("View High Scores")');

    // Verify high score board
    await expect(
      page.locator('[data-testid="high-score-board"]')
    ).toBeVisible();

    // Check if our score is listed
    const scores = page.locator('[data-testid^="high-score-entry-"]');
    const scoreCount = await scores.count();
    expect(scoreCount).toBeGreaterThan(0);
  });

  test("Quiz with specific allergy focus", async ({ page }) => {
    await page.click("text=Custom Mode");

    // Configure for allergy focus
    await page.check('input[value="ingredient-contains-allergy"]');
    await page.check('input[value="menu-item-contains-allergy"]');
    await page.check('input[value="ingredients-with-allergy"]');

    // Select specific allergies to focus on
    const allergyFilter = page.locator('[data-testid="allergy-filter"]');
    if (await allergyFilter.isVisible()) {
      await allergyFilter.click();
      await page.check('input[value="gluten"]');
      await page.check('input[value="dairy"]');
      await page.click("text=Apply");
    }

    await page.click('button:has-text("Start Quiz")');

    // Verify questions are allergy-related
    await page.waitForSelector('[data-testid="quiz-question"]');
    const questionText = await page
      .locator('[data-testid="quiz-question"]')
      .textContent();
    expect(questionText?.toLowerCase()).toMatch(/allerg|gluten|dairy/);
  });

  test("Question feedback and explanations", async ({ page }) => {
    await page.click("text=Training Mode");
    await page.check('input[value="single-ingredient"]');

    // Enable detailed feedback if available
    const feedbackToggle = page.locator('input[name="showFeedback"]');
    if (await feedbackToggle.isVisible()) {
      await feedbackToggle.check();
    }

    await page.click('button:has-text("Start Quiz")');

    // Answer a question
    await page.waitForSelector('[data-testid^="answer-option-"]');
    await page.locator('[data-testid^="answer-option-"]').first().click();

    // Look for feedback
    const feedback = page.locator('[data-testid="answer-feedback"]');
    if (await feedback.isVisible()) {
      const feedbackText = await feedback.textContent();
      expect(feedbackText).toBeTruthy();

      // Check for correct/incorrect indicator
      await expect(
        page
          .locator('[data-testid="answer-correct"]')
          .or(page.locator('[data-testid="answer-incorrect"]'))
      ).toBeVisible();
    }
  });

  test("Quiz statistics and analytics", async ({ page }) => {
    // Complete a quiz
    await page.click("text=Training Mode");
    await page.check('input[value="single-ingredient"]');
    await page.fill('input[name="questionCount"]', "10");
    await page.click('button:has-text("Start Quiz")');

    // Track answers
    let correctAnswers = 0;
    const answerTimes: number[] = [];

    for (let i = 0; i < 10; i++) {
      await page.waitForSelector('[data-testid^="answer-option-"]');

      const startTime = Date.now();
      await page.locator('[data-testid^="answer-option-"]').first().click();
      const answerTime = Date.now() - startTime;
      answerTimes.push(answerTime);

      // Check if answer was correct (if feedback shown)
      const correctIndicator = page.locator('[data-testid="answer-correct"]');
      if (await correctIndicator.isVisible({ timeout: 1000 })) {
        correctAnswers++;
      }

      await page.waitForTimeout(500);
    }

    // At results page
    await expect(page).toHaveURL(/.*quiz\/results/);

    // Check for detailed statistics
    const stats = page.locator('[data-testid="quiz-statistics"]');
    if (await stats.isVisible()) {
      await expect(stats).toContainText("Average Time");
      await expect(stats).toContainText("Accuracy");

      // Check for category breakdown
      const categoryStats = page.locator('[data-testid="category-statistics"]');
      if (await categoryStats.isVisible()) {
        await expect(categoryStats).toBeVisible();
      }
    }

    console.log(
      `Quiz completion stats: ${correctAnswers}/10 correct, avg time: ${
        answerTimes.reduce((a, b) => a + b, 0) / answerTimes.length
      }ms`
    );
  });

  test("Quiz accessibility features", async ({ page }) => {
    await page.goto("/en/restaurant/quiz");

    // Check for keyboard navigation
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");

    // Should be able to select mode with keyboard
    await page.keyboard.press("Space");

    // Navigate to question type checkboxes
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("Tab");
    }

    // Select with keyboard
    await page.keyboard.press("Space");

    // Navigate to start button
    while (
      !(await page
        .locator('button:has-text("Start Quiz")')
        .evaluate((el) => el === document.activeElement))
    ) {
      await page.keyboard.press("Tab");
    }

    await page.keyboard.press("Enter");

    // Should start quiz
    await expect(page).toHaveURL(/.*quiz\/question/);

    // Check for screen reader labels
    const questionLabel = page.locator('[aria-label*="Question"]');
    await expect(questionLabel).toBeVisible();

    // Check answer options have proper labels
    const answerOptions = page.locator('[data-testid^="answer-option-"]');
    const firstOption = answerOptions.first();
    const ariaLabel = await firstOption.getAttribute("aria-label");
    expect(ariaLabel).toBeTruthy();
  });

  test("Performance with large question sets", async ({ page }) => {
    await page.click("text=Custom Mode");

    // Select all question types
    const checkboxes = page.locator(
      'input[type="checkbox"][name="questionTypes"]'
    );
    const count = await checkboxes.count();
    for (let i = 0; i < count; i++) {
      await checkboxes.nth(i).check();
    }

    // Set high question count
    await page.fill('input[name="questionCount"]', "50");

    const startTime = Date.now();
    await page.click('button:has-text("Start Quiz")');
    await page.waitForSelector('[data-testid="quiz-question"]');

    const loadTime = Date.now() - startTime;
    console.log(`Quiz start time with 50 questions: ${loadTime}ms`);

    // Should load quickly even with many questions
    expect(loadTime).toBeLessThan(2000);

    // Test question loading performance
    const questionLoadTimes: number[] = [];

    for (let i = 0; i < 5; i++) {
      const questionStart = Date.now();
      await page.locator('[data-testid^="answer-option-"]').first().click();
      await page.waitForSelector('[data-testid="quiz-question"]');
      questionLoadTimes.push(Date.now() - questionStart);
    }

    const avgLoadTime =
      questionLoadTimes.reduce((a, b) => a + b, 0) / questionLoadTimes.length;
    console.log(`Average question load time: ${avgLoadTime}ms`);

    // Questions should load quickly
    expect(avgLoadTime).toBeLessThan(1000);
  });
});
