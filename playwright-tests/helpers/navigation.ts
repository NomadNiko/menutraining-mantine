import { Page } from '@playwright/test';

export const ROUTES = {
  HOME: '/en',
  SIGN_IN: '/en/sign-in',
  SIGN_UP: '/en/sign-up',
  PROFILE: '/en/profile',
  INGREDIENTS: '/en/restaurant/ingredients',
  RECIPES: '/en/restaurant/recipes',
  MENU_ITEMS: '/en/restaurant/menu-items',
  MENU_SECTIONS: '/en/restaurant/menu-sections',
  MENUS: '/en/restaurant/menus',
  QUIZ: '/en/restaurant/quiz',
  ADMIN_PANEL: '/en/admin-panel',
  ADMIN_USERS: '/en/admin-panel/users',
  ADMIN_RESTAURANTS: '/en/admin-panel/restaurants',
  ADMIN_ALLERGIES: '/en/admin-panel/allergies',
  ADMIN_EQUIPMENT: '/en/admin-panel/equipment'
};

export async function selectRestaurant(page: Page, restaurantName: string) {
  // Look for restaurant selector
  const selector = page.locator('select, [role="combobox"], button:has-text("Select Restaurant")').first();
  if (await selector.isVisible()) {
    await selector.click();
    await page.waitForTimeout(500);
    
    // Select the restaurant
    const option = page.locator(`text="${restaurantName}"`).first();
    if (await option.isVisible()) {
      await option.click();
      await page.waitForTimeout(1000);
    }
  }
}

export async function navigateToSection(page: Page, sectionName: string) {
  // Try to find the navigation link
  const navLink = page.locator(`a:has-text("${sectionName}"), button:has-text("${sectionName}")`).first();
  if (await navLink.isVisible()) {
    await navLink.click();
    await page.waitForLoadState('networkidle');
  }
}