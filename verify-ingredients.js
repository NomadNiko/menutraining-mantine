const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Login
  await page.goto('http://localhost:3000/en/sign-in');
  await page.fill('input[type="email"]', 'aloha@ixplor.app');
  await page.fill('input[type="password"]', 'password');
  await page.click('button[type="submit"]');
  await page.waitForURL(url => !url.pathname.includes('sign-in'));
  
  console.log('Logged in, waiting for initial data load...');
  await page.waitForTimeout(5000);
  
  // Go to ingredients
  await page.goto('http://localhost:3000/en/restaurant/ingredients');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  // Take screenshot
  await page.screenshot({ path: 'ingredients-final.png', fullPage: true });
  
  // Check for ingredients
  const hasNoIngredients = await page.locator('text=No ingredients').first().isVisible().catch(() => false);
  const ingredientCount = await page.locator('table tbody tr, [class*="IngredientCard"]').count();
  
  console.log('Has "No ingredients" message:', hasNoIngredients);
  console.log('Ingredient elements found:', ingredientCount);
  
  if (ingredientCount > 0) {
    console.log('SUCCESS! Ingredients are showing!');
    
    // Get first few ingredient names
    const names = await page.locator('table tbody tr td:first-child, [class*="IngredientCard"] h3').allTextContents();
    console.log('First few ingredients:', names.slice(0, 5));
  }
  
  // Go to menu items
  await page.goto('http://localhost:3000/en/restaurant/menu-items');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  // Take screenshot
  await page.screenshot({ path: 'menu-items-final.png', fullPage: true });
  
  // Check for menu items
  const menuItemCount = await page.locator('table tbody tr, [class*="MenuItemCard"]').count();
  console.log('\nMenu item elements found:', menuItemCount);
  
  if (menuItemCount > 0) {
    console.log('SUCCESS! Menu items are showing!');
  }
  
  await browser.close();
})();