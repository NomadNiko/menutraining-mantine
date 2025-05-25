import { test, expect } from "@playwright/test";

// Helper to sign in as admin
async function signInAsAdmin(page) {
  await page.goto("/en/sign-in");
  await page.waitForLoadState("networkidle");
  await page.fill('input[type="email"]', "admin@example.com");
  await page.fill('input[type="password"]', "secret");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/en", { timeout: 15000 });
}

test.describe("Admin Panel Access Control", () => {
  test("Regular user cannot access admin panel", async ({ page }) => {
    // Sign in as regular user
    await page.goto("/en/sign-in");
    await page.waitForLoadState("networkidle");
    await page.fill('input[type="email"]', "aloha@ixplor.app");
    await page.fill('input[type="password"]', "password");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/en", { timeout: 15000 });

    // Try to access admin panel
    await page.goto("/en/admin-panel");

    // Should be redirected or show forbidden
    const forbidden = page.locator("text=Forbidden");
    const redirected = page.url().includes("admin-panel") === false;

    expect(forbidden.isVisible() || redirected).toBeTruthy();
  });

  test("Admin can access all admin sections", async ({ page }) => {
    await signInAsAdmin(page);

    // Navigate to admin panel
    await page.goto("/en/admin-panel");
    await expect(page).toHaveURL(/.*admin-panel/);

    // Check all admin sections are accessible
    const sections = [
      { name: "Users", url: "/admin-panel/users" },
      { name: "Restaurants", url: "/admin-panel/restaurants" },
      { name: "Allergies", url: "/admin-panel/allergies" },
      { name: "Equipment", url: "/admin-panel/equipment" },
      { name: "Recipes", url: "/admin-panel/recipes" },
    ];

    for (const section of sections) {
      await page.click(`text=${section.name}`);
      await expect(page).toHaveURL(new RegExp(section.url));
      await page.goto("/en/admin-panel");
    }
  });
});

test.describe("User Management", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto("/en/admin-panel/users");
  });

  test("Create new user", async ({ page }) => {
    await page.click('a:has-text("Create User")');
    await page.waitForURL("**/admin-panel/users/create");

    // Fill user form
    const userEmail = `testuser${Date.now()}@example.com`;
    await page.fill('input[name="email"]', userEmail);
    await page.fill('input[name="firstName"]', "Test");
    await page.fill('input[name="lastName"]', "User");
    await page.fill('input[name="password"]', "TestPass123!");
    await page.fill('input[name="confirmPassword"]', "TestPass123!");

    // Select role
    await page.click('[data-testid="role-select"]');
    await page.click("text=User");

    // Select restaurant
    await page.click('[data-testid="restaurant-select"]');
    await page.click(page.locator('[role="option"]').first());

    // Submit
    await page.click('button[type="submit"]');
    await page.waitForURL("**/admin-panel/users");

    // Verify user appears in list
    await expect(page.locator(`text=${userEmail}`)).toBeVisible();
  });

  test("Edit existing user", async ({ page }) => {
    // Find first user in list
    const firstUser = page.locator("tr").nth(1);
    const userEmail = await firstUser.locator("td").nth(1).textContent();

    // Click edit
    await firstUser.locator('[data-testid^="edit-user-"]').click();
    await page.waitForURL("**/admin-panel/users/edit/**");

    // Update user details
    await page.fill('input[name="firstName"]', "Updated");
    await page.fill('input[name="lastName"]', "Name");

    // Change role
    await page.click('[data-testid="role-select"]');
    await page.click("text=Admin");

    // Save
    await page.click('button[type="submit"]');
    await page.waitForURL("**/admin-panel/users");

    // Verify update
    const updatedRow = page.locator("tr", { hasText: userEmail });
    await expect(updatedRow).toContainText("Updated");
    await expect(updatedRow).toContainText("Admin");
  });

  test("Filter and search users", async ({ page }) => {
    // Search by email
    await page.fill('[data-testid="user-search"]', "admin");
    await page.waitForTimeout(500);

    // Verify filtered results
    const results = page.locator("tbody tr");
    const count = await results.count();

    for (let i = 0; i < count; i++) {
      const text = await results.nth(i).textContent();
      expect(text?.toLowerCase()).toContain("admin");
    }

    // Clear search
    await page.fill('[data-testid="user-search"]', "");

    // Filter by role
    await page.click('[data-testid="role-filter"]');
    await page.click("text=Admin");
    await page.waitForTimeout(500);

    // Filter by status
    await page.click('[data-testid="status-filter"]');
    await page.click("text=Active");
  });

  test("Sort users", async ({ page }) => {
    // Sort by email
    await page.click('th:has-text("Email")');
    await page.waitForTimeout(500);

    // Get first email
    const firstEmailBefore = await page
      .locator("tbody tr")
      .first()
      .locator("td")
      .nth(1)
      .textContent();

    // Sort reverse
    await page.click('th:has-text("Email")');
    await page.waitForTimeout(500);

    const firstEmailAfter = await page
      .locator("tbody tr")
      .first()
      .locator("td")
      .nth(1)
      .textContent();

    // Should be different
    expect(firstEmailBefore).not.toBe(firstEmailAfter);

    // Sort by created date
    await page.click('th:has-text("Created")');
  });

  test("Bulk user operations", async ({ page }) => {
    // Select multiple users
    const checkboxes = page.locator(
      'input[type="checkbox"][data-testid^="select-user-"]'
    );
    const count = await checkboxes.count();

    if (count >= 2) {
      await checkboxes.nth(0).check();
      await checkboxes.nth(1).check();

      // Check bulk actions
      await expect(page.locator('[data-testid="bulk-actions"]')).toBeVisible();

      // Test bulk deactivate
      await page.click('[data-testid="bulk-deactivate"]');
      await page.click("text=Confirm");

      // Verify success message
      await expect(page.locator("text=Users deactivated")).toBeVisible();
    }
  });

  test("Reset user password", async ({ page }) => {
    // Find a user
    const firstUser = page.locator("tr").nth(1);

    // Click password reset
    await firstUser.locator('[data-testid^="reset-password-"]').click();

    // Confirm dialog
    await page.click("text=Reset Password");

    // Should show success
    await expect(page.locator("text=Password reset email sent")).toBeVisible();
  });
});

test.describe("Restaurant Management", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto("/en/admin-panel/restaurants");
  });

  test("Create new restaurant", async ({ page }) => {
    await page.click('a:has-text("Create Restaurant")');
    await page.waitForURL("**/admin-panel/restaurants/create");

    // Fill restaurant details
    const restaurantName = `Test Restaurant ${Date.now()}`;
    await page.fill('input[name="name"]', restaurantName);
    await page.fill('input[name="address"]', "123 Test Street");
    await page.fill('input[name="city"]', "Test City");
    await page.fill('input[name="state"]', "TS");
    await page.fill('input[name="zipCode"]', "12345");
    await page.fill('input[name="phone"]', "+1234567890");
    await page.fill(
      'textarea[name="description"]',
      "Test restaurant description"
    );

    // Set operating hours
    await page.fill('input[name="openingTime"]', "09:00");
    await page.fill('input[name="closingTime"]', "22:00");

    // Upload logo if available
    const logoInput = page.locator('input[type="file"][name="logo"]');
    if (await logoInput.isVisible()) {
      await logoInput.setInputFiles({
        name: "logo.jpg",
        mimeType: "image/jpeg",
        buffer: Buffer.from("fake-logo"),
      });
    }

    // Submit
    await page.click('button[type="submit"]');
    await page.waitForURL("**/admin-panel/restaurants");

    // Verify restaurant appears
    await expect(page.locator(`text=${restaurantName}`)).toBeVisible();
  });

  test("Manage restaurant users", async ({ page }) => {
    // Click on first restaurant
    const firstRestaurant = page.locator("tr").nth(1);
    await firstRestaurant.locator('[data-testid^="manage-users-"]').click();
    await page.waitForURL("**/admin-panel/restaurants/**/users");

    // Add user to restaurant
    await page.click('[data-testid="add-user-button"]');

    // Select user
    await page.click('[data-testid="user-select"]');
    await page.click(page.locator('[role="option"]').first());

    // Set role
    await page.click('[data-testid="restaurant-role-select"]');
    await page.click("text=Manager");

    // Add
    await page.click('button:has-text("Add User")');

    // Verify user added
    await expect(page.locator("text=User added successfully")).toBeVisible();

    // Remove user
    const userRow = page.locator("tr").nth(1);
    await userRow.locator('[data-testid^="remove-user-"]').click();
    await page.click("text=Remove");

    // Verify removal
    await expect(page.locator("text=User removed")).toBeVisible();
  });

  test("Edit restaurant details", async ({ page }) => {
    // Edit first restaurant
    const firstRestaurant = page.locator("tr").nth(1);
    await firstRestaurant.locator('[data-testid^="edit-restaurant-"]').click();
    await page.waitForURL("**/admin-panel/restaurants/edit/**");

    // Update details
    await page.fill('input[name="phone"]', "+9876543210");
    await page.fill('textarea[name="description"]', "Updated description");

    // Toggle active status
    const activeToggle = page.locator('input[name="isActive"]');
    await activeToggle.click();

    // Save
    await page.click('button[type="submit"]');
    await page.waitForURL("**/admin-panel/restaurants");

    // Verify update
    await expect(page.locator("text=Restaurant updated")).toBeVisible();
  });
});

test.describe("Allergy Management", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto("/en/admin-panel/allergies");
  });

  test("Create new allergy", async ({ page }) => {
    await page.click('a:has-text("Create Allergy")');
    await page.waitForURL("**/admin-panel/allergies/create");

    // Fill allergy details
    const allergyName = `Test Allergy ${Date.now()}`;
    await page.fill('input[name="name"]', allergyName);
    await page.fill('textarea[name="description"]', "Test allergy description");

    // Set severity
    await page.click('[data-testid="severity-select"]');
    await page.click("text=Severe");

    // Add symptoms
    await page.fill('input[name="symptoms"]', "Rash, Itching, Swelling");

    // Submit
    await page.click('button[type="submit"]');
    await page.waitForURL("**/admin-panel/allergies");

    // Verify creation
    await expect(page.locator(`text=${allergyName}`)).toBeVisible();
  });

  test("Edit allergy with validation", async ({ page }) => {
    const firstAllergy = page.locator("tr").nth(1);
    await firstAllergy.locator('[data-testid^="edit-allergy-"]').click();

    // Clear name and try to save
    await page.fill('input[name="name"]', "");
    await page.click('button[type="submit"]');

    // Should show validation error
    await expect(page.locator("text=Name is required")).toBeVisible();

    // Fill valid name
    await page.fill('input[name="name"]', "Updated Allergy");
    await page.click('button[type="submit"]');

    // Should succeed
    await expect(page).toHaveURL("**/admin-panel/allergies");
  });

  test("Search and filter allergies", async ({ page }) => {
    // Search
    await page.fill('[data-testid="allergy-search"]', "gluten");
    await page.waitForTimeout(500);

    // Check results
    const results = page.locator("tbody tr");
    if ((await results.count()) > 0) {
      const firstResult = await results.first().textContent();
      expect(firstResult?.toLowerCase()).toContain("gluten");
    }

    // Filter by severity
    await page.click('[data-testid="severity-filter"]');
    await page.click("text=Severe");
    await page.waitForTimeout(500);
  });
});

test.describe("Equipment Management", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto("/en/admin-panel/equipment");
  });

  test("Create equipment with categories", async ({ page }) => {
    await page.click('a:has-text("Create Equipment")');

    const equipmentName = `Test Equipment ${Date.now()}`;
    await page.fill('input[name="name"]', equipmentName);
    await page.fill('textarea[name="description"]', "Test equipment");

    // Select category
    await page.click('[data-testid="category-select"]');
    await page.click("text=Cooking");

    // Add specifications
    await page.fill('input[name="brand"]', "TestBrand");
    await page.fill('input[name="model"]', "Model-123");

    // Submit
    await page.click('button[type="submit"]');
    await page.waitForURL("**/admin-panel/equipment");

    // Verify
    await expect(page.locator(`text=${equipmentName}`)).toBeVisible();
  });

  test("Bulk equipment operations", async ({ page }) => {
    // Select multiple items
    const checkboxes = page.locator(
      'input[type="checkbox"][data-testid^="select-equipment-"]'
    );
    const count = await checkboxes.count();

    if (count >= 2) {
      await checkboxes.nth(0).check();
      await checkboxes.nth(1).check();

      // Export selected
      const exportButton = page.locator('[data-testid="export-selected"]');
      if (await exportButton.isVisible()) {
        const downloadPromise = page.waitForEvent("download");
        await exportButton.click();
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toContain("equipment");
      }
    }
  });
});

test.describe("Admin Recipe Management", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto("/en/admin-panel/recipes");
  });

  test("View all recipes across restaurants", async ({ page }) => {
    // Should see recipes from all restaurants
    await expect(page.locator('h1:has-text("All Recipes")')).toBeVisible();

    // Check restaurant column is visible
    await expect(page.locator('th:has-text("Restaurant")')).toBeVisible();

    // Filter by restaurant
    await page.click('[data-testid="restaurant-filter"]');
    const restaurants = page.locator('[role="option"]');
    if ((await restaurants.count()) > 0) {
      await restaurants.first().click();
      await page.waitForTimeout(500);

      // All results should be from selected restaurant
      const restaurantCells = page.locator('td[data-testid="restaurant-name"]');
      const count = await restaurantCells.count();
      if (count > 0) {
        const firstName = await restaurantCells.first().textContent();
        for (let i = 1; i < count; i++) {
          const name = await restaurantCells.nth(i).textContent();
          expect(name).toBe(firstName);
        }
      }
    }
  });

  test("Approve/reject recipe submissions", async ({ page }) => {
    // Look for pending recipes
    await page.click('[data-testid="status-filter"]');
    await page.click("text=Pending");
    await page.waitForTimeout(500);

    const pendingRecipes = page.locator('tr[data-status="pending"]');
    if ((await pendingRecipes.count()) > 0) {
      const firstPending = pendingRecipes.first();

      // Approve
      await firstPending.locator('[data-testid^="approve-recipe-"]').click();
      await page.click("text=Approve");

      await expect(page.locator("text=Recipe approved")).toBeVisible();

      // Find another pending and reject
      const anotherPending = page.locator('tr[data-status="pending"]').first();
      if (await anotherPending.isVisible()) {
        await anotherPending.locator('[data-testid^="reject-recipe-"]').click();
        await page.fill(
          'textarea[name="rejectionReason"]',
          "Missing information"
        );
        await page.click("text=Reject");

        await expect(page.locator("text=Recipe rejected")).toBeVisible();
      }
    }
  });
});
