import { Page } from '@playwright/test';

export async function login(page: Page, email: string = 'aloha@ixplor.app', password: string = 'password') {
  await page.goto('/en/sign-in');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);
  
  // Wait for navigation away from sign-in page
  await page.waitForURL((url) => !url.pathname.includes('sign-in'), { timeout: 10000 });
}

export async function logout(page: Page) {
  // Click on user menu/profile button
  const userMenu = page.locator('[aria-label*="user"], [aria-label*="profile"], button:has-text("Sign Out")').first();
  if (await userMenu.isVisible()) {
    await userMenu.click();
    
    // Click sign out
    const signOutButton = page.locator('button:has-text("Sign Out"), a:has-text("Sign Out")').first();
    if (await signOutButton.isVisible()) {
      await signOutButton.click();
      await page.waitForTimeout(1000);
    }
  }
}