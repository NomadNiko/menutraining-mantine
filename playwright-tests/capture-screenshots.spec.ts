import { test } from "@playwright/test";
import { login } from "./helpers/auth";

test.describe("Capture Screenshots for Test ID Planning", () => {
  test("Capture all main pages", async ({ page }) => {
    // 1. Sign-in page
    await page.goto("/en/sign-in");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: "playwright-tests/screenshots/01-sign-in-page.png",
      fullPage: true,
    });

    // Login
    await login(page);

    // 2. Home/Dashboard
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: "playwright-tests/screenshots/02-dashboard.png",
      fullPage: true,
    });

    // 3. Ingredients page
    await page.goto("/en/restaurant/ingredients");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: "playwright-tests/screenshots/03-ingredients-list.png",
      fullPage: true,
    });

    // 4. Create ingredient
    await page.goto("/en/restaurant/ingredients/create");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: "playwright-tests/screenshots/04-ingredients-create.png",
      fullPage: true,
    });

    // 5. Menu Items page
    await page.goto("/en/restaurant/menu-items");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: "playwright-tests/screenshots/05-menu-items-list.png",
      fullPage: true,
    });

    // 6. Create menu item
    await page.goto("/en/restaurant/menu-items/create");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: "playwright-tests/screenshots/06-menu-items-create.png",
      fullPage: true,
    });

    // 7. Recipes page
    await page.goto("/en/restaurant/recipes");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: "playwright-tests/screenshots/07-recipes-list.png",
      fullPage: true,
    });

    // 8. Menu Sections
    await page.goto("/en/restaurant/menu-sections");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: "playwright-tests/screenshots/08-menu-sections-list.png",
      fullPage: true,
    });

    // 9. Menus
    await page.goto("/en/restaurant/menus");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: "playwright-tests/screenshots/09-menus-list.png",
      fullPage: true,
    });

    // 10. Quiz configuration
    await page.goto("/en/restaurant/quiz");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: "playwright-tests/screenshots/10-quiz-config.png",
      fullPage: true,
    });

    // 11. Profile page
    await page.goto("/en/profile");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: "playwright-tests/screenshots/11-profile.png",
      fullPage: true,
    });

    // 12. Profile edit
    await page.goto("/en/profile/edit");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: "playwright-tests/screenshots/12-profile-edit.png",
      fullPage: true,
    });

    // 13. Admin panel (if accessible)
    try {
      await page.goto("/en/admin-panel");
      await page.waitForLoadState("networkidle");
      await page.screenshot({
        path: "playwright-tests/screenshots/13-admin-panel.png",
        fullPage: true,
      });
    } catch (e) {
      console.log("Admin panel not accessible");
    }

    console.log("Screenshots captured successfully!");
  });
});
