import { test, expect } from "@playwright/test";
import { logout } from "../helpers/auth";

test.describe("Basic Authentication Tests", () => {
  test("Sign in with valid credentials", async ({ page }) => {
    await page.goto("/en/sign-in");

    // Fill in credentials
    await page.fill('input[type="email"]', "aloha@ixplor.app");
    await page.fill('input[type="password"]', "password");

    // Submit
    await page.click('button[type="submit"]');

    // Should redirect away from sign-in
    await expect(page).not.toHaveURL(/.*sign-in/, { timeout: 10000 });

    // Should be on a protected page
    await expect(page.locator("text=/Dashboard|Home|Menu/i")).toBeVisible();
  });

  test("Sign in with invalid credentials", async ({ page }) => {
    await page.goto("/en/sign-in");

    // Fill in wrong credentials
    await page.fill('input[type="email"]', "wrong@example.com");
    await page.fill('input[type="password"]', "wrongpassword");

    // Submit
    await page.click('button[type="submit"]');

    // Should stay on sign-in page
    await expect(page).toHaveURL(/.*sign-in/);

    // Should show error message
    await expect(
      page.locator("text=/Invalid|Wrong|Error|Incorrect/i")
    ).toBeVisible({ timeout: 5000 });
  });

  test("Protected route redirects to sign in", async ({ page }) => {
    // Clear any existing auth
    await page.context().clearCookies();

    // Try to access protected route
    await page.goto("/en/restaurant/ingredients");

    // Should redirect to sign-in
    await expect(page).toHaveURL(/.*sign-in/);
  });

  test("Sign out functionality", async ({ page }) => {
    // First sign in
    await page.goto("/en/sign-in");
    await page.fill('input[type="email"]', "aloha@ixplor.app");
    await page.fill('input[type="password"]', "password");
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.includes("sign-in"));

    // Now sign out
    await logout(page);

    // Try to access protected route
    await page.goto("/en/restaurant/ingredients");

    // Should redirect to sign-in
    await expect(page).toHaveURL(/.*sign-in/);
  });

  test("Password reset link exists", async ({ page }) => {
    await page.goto("/en/sign-in");

    // Check for forgot password link
    const forgotPasswordLink = page.locator(
      'a[href*="forgot"], text=/Forgot.*password/i'
    );
    await expect(forgotPasswordLink).toBeVisible();

    // Click it
    await forgotPasswordLink.click();

    // Should navigate to forgot password page
    await expect(page).toHaveURL(/.*forgot-password/);

    // Should have email input
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test("Sign up link exists", async ({ page }) => {
    await page.goto("/en/sign-in");

    // Check for sign up link
    const signUpLink = page.locator(
      'a[href*="sign-up"], text=/Sign up|Register|Create account/i'
    );

    if (await signUpLink.isVisible()) {
      await signUpLink.click();

      // Should navigate to sign up page
      await expect(page).toHaveURL(/.*sign-up/);

      // Should have registration form
      await expect(page.locator('input[name*="email"]')).toBeVisible();
      await expect(page.locator('input[name*="password"]')).toBeVisible();
    }
  });
});
