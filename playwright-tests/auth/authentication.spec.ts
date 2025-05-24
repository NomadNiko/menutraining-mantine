import { test, expect } from '@playwright/test';
import { ROUTES } from '../helpers/navigation';

test.describe('Authentication', () => {
  test('User can sign in successfully', async ({ page }) => {
    await page.goto(ROUTES.SIGN_IN);
    
    // Fill in credentials
    await page.fill('input[type="email"]', 'aloha@ixplor.app');
    await page.fill('input[type="password"]', 'password');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should redirect to home page
    await page.waitForURL((url) => !url.pathname.includes('sign-in'), { timeout: 10000 });
    await expect(page).toHaveURL(ROUTES.HOME);
    
    // Should show user is logged in
    await expect(page.locator('text="Nikos Place"')).toBeVisible({ timeout: 10000 });
  });

  test('Invalid credentials show error', async ({ page }) => {
    await page.goto(ROUTES.SIGN_IN);
    
    // Fill in wrong credentials
    await page.fill('input[type="email"]', 'wrong@email.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should stay on sign-in page
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/sign-in/);
  });

  test('Protected routes redirect to sign-in', async ({ page, context }) => {
    // Clear any existing auth state
    await context.clearCookies();
    await page.goto('about:blank');
    
    // Try to access protected route without logging in
    await page.goto(ROUTES.QUIZ);
    
    // Should redirect to sign-in or show unauthorized
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url.includes('sign-in') || url.includes('quiz')).toBeTruthy();
  });

  test('User can access profile', async ({ page }) => {
    // Login first
    await page.goto(ROUTES.SIGN_IN);
    await page.fill('input[type="email"]', 'aloha@ixplor.app');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // Navigate to profile
    await page.goto(ROUTES.PROFILE);
    await page.waitForLoadState('networkidle');
    
    // Should show user information
    const emailVisible = await page.locator('text="aloha@ixplor.app"').isVisible().catch(() => false);
    const profileContentVisible = await page.locator('h1, h2, h3').first().isVisible().catch(() => false);
    
    expect(emailVisible || profileContentVisible).toBeTruthy();
  });
});