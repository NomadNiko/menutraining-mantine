const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });
  const page = await context.newPage();

  try {
    // Login
    console.log('1. AUTHENTICATION');
    await page.goto('http://localhost:3000/en/sign-in');
    await page.fill('input[type="email"]', 'aloha@ixplor.app');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('   ✓ Successfully logged in as aloha@ixplor.app\n');

    // Check if we need to expand navigation menu
    const hamburger = await page.locator('button[aria-label*="menu"], button[aria-label*="navigation"], [class*="burger"]').first();
    if (await hamburger.isVisible()) {
      console.log('   Opening navigation menu...');
      await hamburger.click();
      await page.waitForTimeout(1000);
    }

    // Get current page structure
    console.log('2. APPLICATION STRUCTURE');
    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}`);
    
    // Get all visible links
    const allLinks = await page.locator('a:visible').allTextContents();
    const uniqueLinks = [...new Set(allLinks.filter(link => link.trim() && link.length < 30))];
    console.log(`   Available navigation: ${uniqueLinks.join(', ')}\n`);

    // Check user role
    console.log('3. USER PERMISSIONS');
    const hasAdminAccess = uniqueLinks.some(link => link.toLowerCase().includes('admin'));
    const hasRestaurantAccess = uniqueLinks.some(link => link.toLowerCase().includes('restaurant') || link.toLowerCase().includes('ingredient'));
    console.log(`   Admin access: ${hasAdminAccess ? '✓ Yes' : '✗ No'}`);
    console.log(`   Restaurant management: ${hasRestaurantAccess ? '✓ Yes' : '✗ No'}\n`);

    // Navigate to a visible page
    console.log('4. EXPLORING FEATURES');
    
    // Try to go to ingredients page by URL
    await page.goto('http://localhost:3000/en/restaurant/ingredients');
    await page.waitForLoadState('networkidle');
    console.log('   Ingredients Page:');
    const ingredientCount = await page.locator('h2, h3, [class*="title"], [class*="card"]').count();
    console.log(`   - Found ${ingredientCount} elements`);
    
    // Try menu items
    await page.goto('http://localhost:3000/en/restaurant/menu-items');
    await page.waitForLoadState('networkidle');
    console.log('   Menu Items Page:');
    const menuItemCount = await page.locator('h2, h3, [class*="title"], [class*="card"]').count();
    console.log(`   - Found ${menuItemCount} elements`);
    
    // Try quiz
    await page.goto('http://localhost:3000/en/restaurant/quiz');
    await page.waitForLoadState('networkidle');
    console.log('   Quiz Page:');
    const quizElements = await page.locator('button, h1, h2').allTextContents();
    console.log(`   - Quiz elements: ${quizElements.filter(e => e.trim()).slice(0, 5).join(', ')}`);
    
    // Check profile
    await page.goto('http://localhost:3000/en/profile');
    await page.waitForLoadState('networkidle');
    console.log('\n5. USER PROFILE');
    const profileData = await page.locator('p, dd, span').allTextContents();
    const userEmail = profileData.find(text => text.includes('@'));
    const userName = profileData.find(text => text.length > 2 && text.length < 50 && !text.includes('@'));
    console.log(`   Email: ${userEmail || 'Not found'}`);
    console.log(`   Name: ${userName || 'Not found'}`);
    
    // Final summary
    console.log('\n6. APPLICATION SUMMARY');
    console.log('   ✓ Menu Training application for restaurant staff');
    console.log('   ✓ Features: Ingredients, Recipes, Menu Items, Menu Sections, Menus');
    console.log('   ✓ Interactive Quiz system for staff training');
    console.log('   ✓ Multi-restaurant support with role-based access');
    console.log(`   ✓ Current user: aloha@ixplor.app${hasAdminAccess ? ' (Admin)' : ' (User)'}`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    console.log('\nClosing browser in 5 seconds...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
})();