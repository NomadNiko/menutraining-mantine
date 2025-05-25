import { test, expect } from "@playwright/test";

test.describe("Sign-In Page Comprehensive Test", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en/sign-in");
    await page.waitForLoadState("networkidle");
  });

  test("Sign-in page has all required elements with test IDs", async ({
    page,
  }) => {
    // Check page title
    await expect(page).toHaveTitle(/Sign In/);

    // Verify all elements are present with test IDs
    await expect(page.locator('[data-testid="email"]')).toBeVisible();
    await expect(page.locator('[data-testid="password"]')).toBeVisible();
    await expect(page.locator('[data-testid="forgot-password"]')).toBeVisible();
    await expect(page.locator('[data-testid="sign-in-submit"]')).toBeVisible();
    await expect(page.locator('[data-testid="create-account"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="google-login-button"]')
    ).toBeVisible();

    // Check header elements
    await expect(
      page.locator('[data-testid="desktop-logo-link"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="theme-switch-button"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="desktop-sign-in-button"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="desktop-sign-up-button"]')
    ).toBeVisible();
  });

  test("Sign-in form validation works correctly", async ({ page }) => {
    // Try to submit empty form
    await page.click('[data-testid="sign-in-submit"]');

    // Check for validation errors
    await expect(page.getByText(/required/i).first()).toBeVisible();

    // Fill invalid email
    await page.fill('[data-testid="email"]', "invalid-email");
    await page.fill('[data-testid="password"]', "123"); // Too short
    await page.click('[data-testid="sign-in-submit"]');

    // Check for specific validation errors
    await expect(page.getByText(/email is not valid/i)).toBeVisible();
    await expect(
      page.getByText(/password must be at least 6 characters long/i)
    ).toBeVisible();
  });

  test("Successful sign-in flow with timing measurements", async ({ page }) => {
    // Measure time for page load
    const startTime = Date.now();

    // Fill in valid credentials
    await page.fill('[data-testid="email"]', "aloha@ixplor.app");
    await page.fill('[data-testid="password"]', "password");

    // Measure form fill time
    const fillTime = Date.now() - startTime;
    console.log(`Form fill time: ${fillTime}ms`);

    // Click sign in and measure authentication time
    const authStartTime = Date.now();
    await page.click('[data-testid="sign-in-submit"]');

    // Wait for navigation
    await page.waitForURL((url) => !url.pathname.includes("sign-in"), {
      timeout: 10000,
    });

    const authTime = Date.now() - authStartTime;
    console.log(`Authentication time: ${authTime}ms`);

    // Verify we're logged in
    await expect(
      page.locator('[data-testid="profile-menu-item"]')
    ).toBeVisible();

    // Total time
    const totalTime = Date.now() - startTime;
    console.log(`Total sign-in flow time: ${totalTime}ms`);
  });

  test("Theme switch button works correctly", async ({ page }) => {
    const themeButton = page.locator('[data-testid="theme-switch-button"]');

    // Get initial theme
    const initialTheme = await page.evaluate(() =>
      document.documentElement.getAttribute("data-mantine-color-scheme")
    );

    // Click theme switch
    await themeButton.click();

    // Verify theme changed
    const newTheme = await page.evaluate(() =>
      document.documentElement.getAttribute("data-mantine-color-scheme")
    );

    expect(newTheme).not.toBe(initialTheme);
  });

  test("Navigation links work correctly", async ({ page }) => {
    // Test forgot password link
    await page.click('[data-testid="forgot-password"]');
    await expect(page).toHaveURL(/forgot-password/);

    // Go back to sign-in
    await page.goto("/en/sign-in");

    // Test create account button
    await page.click('[data-testid="create-account"]');
    await expect(page).toHaveURL(/sign-up/);

    // Go back to sign-in
    await page.goto("/en/sign-in");

    // Test logo link
    await page.click('[data-testid="desktop-logo-link"]');
    await expect(page).toHaveURL(/\/en\/?$/);
  });

  test("Mobile navigation works correctly", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Check mobile-specific elements
    await expect(
      page.locator('[data-testid="mobile-burger-menu"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="mobile-logo-link"]')
    ).toBeVisible();

    // Open mobile menu
    await page.click('[data-testid="mobile-burger-menu"]');

    // Wait for menu to open
    await page.waitForTimeout(500);

    // Verify mobile navigation is visible
    const mobileNav = page.locator("nav").first();
    await expect(mobileNav).toBeVisible();
  });

  test("Performance: Measure component render times", async ({ page }) => {
    // Add performance marks
    await page.addInitScript(() => {
      window.addEventListener("DOMContentLoaded", () => {
        performance.mark("dom-content-loaded");
      });
    });

    // Navigate and measure
    const navigationStart = Date.now();
    await page.goto("/en/sign-in");

    // Wait for specific elements to be visible
    await page.waitForSelector('[data-testid="email"]');
    const inputsVisible = Date.now() - navigationStart;

    await page.waitForSelector('[data-testid="google-login-button"]');
    const googleButtonVisible = Date.now() - navigationStart;

    console.log(`Performance metrics:
      - Inputs visible: ${inputsVisible}ms
      - Google button visible: ${googleButtonVisible}ms
    `);

    // Check if times are within acceptable limits
    expect(inputsVisible).toBeLessThan(2000); // Inputs should appear within 2s
    expect(googleButtonVisible).toBeLessThan(3000); // Google button within 3s
  });
});
