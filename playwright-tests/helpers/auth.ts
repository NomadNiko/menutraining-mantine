import { Page } from "@playwright/test";

export async function login(
  page: Page,
  email: string = "aloha@ixplor.app",
  password: string = "password"
) {
  await page.goto("/en/sign-in");
  await page.waitForLoadState("networkidle");
  
  // Fill email and password
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  
  // Click submit button
  await page.click('button[type="submit"]');
  
  // Wait for navigation away from sign-in page
  await page.waitForURL((url) => !url.pathname.includes("sign-in"), {
    timeout: 15000,
  });
}

export async function logout(page: Page) {
  // Click on user menu/profile button
  const userMenu = page
    .locator(
      '[aria-label*="user"], [aria-label*="profile"], button:has-text("Sign Out")'
    )
    .first();
  if (await userMenu.isVisible()) {
    await userMenu.click();

    // Click sign out
    const signOutButton = page
      .locator('button:has-text("Sign Out"), a:has-text("Sign Out")')
      .first();
    if (await signOutButton.isVisible()) {
      await signOutButton.click();
      await page.waitForTimeout(1000);
    }
  }
}
