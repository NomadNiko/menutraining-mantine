import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';
import { ROUTES } from '../helpers/navigation';

test.describe('Restaurant Data Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Ingredients page displays data', async ({ page }) => {
    await page.goto(ROUTES.INGREDIENTS);
    await page.waitForLoadState('networkidle');
    
    // Check for ingredients
    const dataElements = await page.locator('tr, [class*="card"], [class*="Card"]').count();
    expect(dataElements).toBeGreaterThan(0);
    
    // Look for specific ingredient information
    const pageContent = await page.textContent('body');
    expect(pageContent).toContain('Almonds');
    expect(pageContent).toContain('Tree Nut');
  });

  test('Menu Items page displays data', async ({ page }) => {
    await page.goto(ROUTES.MENU_ITEMS);
    await page.waitForLoadState('networkidle');
    
    // Check for menu items
    const dataElements = await page.locator('tr, [class*="card"], [class*="Card"]').count();
    expect(dataElements).toBeGreaterThan(0);
  });

  test('Recipes page is accessible', async ({ page }) => {
    await page.goto(ROUTES.RECIPES);
    await page.waitForLoadState('networkidle');
    
    // Should not redirect to sign-in
    await expect(page).not.toHaveURL(/sign-in/);
    
    // Page should load
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('Menu Sections page is accessible', async ({ page }) => {
    await page.goto(ROUTES.MENU_SECTIONS);
    await page.waitForLoadState('networkidle');
    
    // Should not redirect to sign-in
    await expect(page).not.toHaveURL(/sign-in/);
    
    // Check for menu sections
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/Breakfast Menu|Lunch Menu/);
  });

  test('Menus page is accessible', async ({ page }) => {
    await page.goto(ROUTES.MENUS);
    await page.waitForLoadState('networkidle');
    
    // Should not redirect to sign-in
    await expect(page).not.toHaveURL(/sign-in/);
  });

  test('Restaurant context is maintained', async ({ page }) => {
    // Navigate to any restaurant page
    await page.goto(ROUTES.INGREDIENTS);
    
    // Check that Nikos Place is selected
    await expect(page.locator('text="Nikos Place"')).toBeVisible();
    
    // Navigate to another page
    await page.goto(ROUTES.MENU_ITEMS);
    
    // Restaurant context should persist
    await expect(page.locator('text="Nikos Place"')).toBeVisible();
  });
});