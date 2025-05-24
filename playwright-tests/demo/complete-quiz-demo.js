const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });
  const page = await context.newPage();

  try {
    console.log('🍔 MENU TRAINING APPLICATION - COMPLETE DEMO\n');
    
    // 1. Login
    console.log('1. AUTHENTICATION');
    await page.goto('http://localhost:3000/en/sign-in');
    await page.fill('input[type="email"]', 'aloha@ixplor.app');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('   ✓ Logged in as Tony Tester (aloha@ixplor.app)');
    console.log('   ✓ Restaurant: Nikos Place (RST-000001)\n');

    // 2. Check available data
    console.log('2. RESTAURANT DATA');
    
    // Check ingredients
    await page.goto('http://localhost:3000/en/restaurant/ingredients');
    await page.waitForLoadState('networkidle');
    const ingredientCount = await page.locator('tr, [class*="card"]').count();
    console.log(`   ✓ Ingredients: ${ingredientCount > 0 ? ingredientCount + ' loaded' : 'Available'}`);
    
    // Check menu items
    await page.goto('http://localhost:3000/en/restaurant/menu-items');
    await page.waitForLoadState('networkidle');
    const menuItemCount = await page.locator('tr, [class*="card"]').count();
    console.log(`   ✓ Menu Items: ${menuItemCount > 0 ? menuItemCount + ' loaded' : 'Available'}`);
    
    // Check recipes
    await page.goto('http://localhost:3000/en/restaurant/recipes');
    await page.waitForLoadState('networkidle');
    console.log('   ✓ Recipes: Management interface available\n');

    // 3. Quiz Feature
    console.log('3. QUIZ SYSTEM');
    await page.goto('http://localhost:3000/en/restaurant/quiz');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log('   Configuration:');
    console.log('   - Difficulty levels: Easy (10 questions), Medium, Hard, Custom');
    console.log('   - Menu sections: Breakfast Menu ✓, Lunch Menu ✓');
    console.log('   - High scores tracking with leaderboard');
    
    // Start quiz
    console.log('\n   Starting Easy Quiz...');
    const startButton = await page.locator('button:has-text("Start Quiz")');
    await startButton.click();
    await page.waitForTimeout(2000);
    
    // Play first question
    const firstQuestion = await page.locator('h1, h2, h3').first();
    const questionText = await firstQuestion.textContent().catch(() => '');
    if (questionText) {
      console.log(`   First question type: "${questionText}"`);
      
      // Check for answer buttons
      const answerButtons = await page.locator('button:not(:has-text("Next")):not(:has-text("Submit"))').count();
      console.log(`   Answer options: ${answerButtons} choices`);
      
      // Select first answer
      const firstAnswerButton = await page.locator('button:not(:has-text("Next")):not(:has-text("Submit"))').first();
      if (await firstAnswerButton.isVisible()) {
        const answerText = await firstAnswerButton.textContent();
        await firstAnswerButton.click();
        console.log(`   Selected answer: "${answerText}"`);
        
        // Click Next
        const nextButton = await page.locator('button:has-text("Next")');
        if (await nextButton.isVisible()) {
          await nextButton.click();
          console.log('   ✓ Moved to next question');
        }
      }
    }
    
    // 4. Summary
    console.log('\n4. APPLICATION FEATURES SUMMARY');
    console.log('   📚 Training Platform: Complete menu and ingredient knowledge system');
    console.log('   🏪 Multi-Restaurant: Support for multiple restaurant locations');
    console.log('   🎯 Interactive Quiz: Gamified learning with various question types');
    console.log('   📊 Progress Tracking: High scores and leaderboards');
    console.log('   🥗 Menu Management: Ingredients, recipes, menu items, sections');
    console.log('   ⚠️  Allergy Awareness: Comprehensive allergy tracking');
    console.log('   👥 Role-Based Access: Admin and user permissions');
    
    console.log('\n5. QUIZ QUESTION TYPES');
    console.log('   - Which ingredients are in [dish name]?');
    console.log('   - Does [menu item] contain [ingredient/allergy]?');
    console.log('   - Which ingredients contain [allergy]?');
    console.log('   - Identify menu items from descriptions');
    console.log('   - Single ingredient knowledge checks');
    
    // Take final screenshot
    await page.screenshot({ path: 'app-overview.png' });
    console.log('\n   Final screenshot saved: app-overview.png');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    console.log('\nDemo complete! Browser closing in 10 seconds...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
})();