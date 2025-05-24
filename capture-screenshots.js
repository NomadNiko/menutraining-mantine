const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  
  try {
    // 1. Sign In Page
    await page.goto('http://localhost:3000/en/sign-in');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'docs/images/sign-in.png' });
    console.log('✓ Sign-in page captured');
    
    // 2. Login
    await page.fill('input[type="email"]', 'aloha@ixplor.app');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // 3. Home Dashboard
    await page.screenshot({ path: 'docs/images/dashboard.png' });
    console.log('✓ Dashboard captured');
    
    // 4. Ingredients Page
    await page.goto('http://localhost:3000/en/restaurant/ingredients');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'docs/images/ingredients.png' });
    console.log('✓ Ingredients page captured');
    
    // 5. Menu Items Page
    await page.goto('http://localhost:3000/en/restaurant/menu-items');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'docs/images/menu-items.png' });
    console.log('✓ Menu items page captured');
    
    // 6. Recipes Page
    await page.goto('http://localhost:3000/en/restaurant/recipes');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'docs/images/recipes.png' });
    console.log('✓ Recipes page captured');
    
    // 7. Quiz Configuration
    await page.goto('http://localhost:3000/en/restaurant/quiz');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'docs/images/quiz-config.png' });
    console.log('✓ Quiz configuration captured');
    
    // 8. Start Quiz and wait for question
    await page.click('button:has-text("Start Quiz")');
    console.log('Waiting 20 seconds for quiz to load...');
    await page.waitForTimeout(20000);
    await page.screenshot({ path: 'docs/images/quiz-question.png' });
    console.log('✓ Quiz question captured');
    
    // 9. Profile Page
    await page.goto('http://localhost:3000/en/profile');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'docs/images/profile.png' });
    console.log('✓ Profile page captured');
    
    // 10. Mobile View
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('http://localhost:3000/en');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'docs/images/mobile-view.png' });
    console.log('✓ Mobile view captured');
    
    console.log('\nAll screenshots captured successfully!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();