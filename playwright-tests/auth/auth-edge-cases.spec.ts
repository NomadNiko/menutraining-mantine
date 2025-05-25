import { test, expect } from "@playwright/test";

test.describe("Authentication Edge Cases", () => {
  test("Password reset flow", async ({ page }) => {
    await page.goto("/en/sign-in");

    // Click forgot password
    await page.click('[data-testid="forgot-password"]');
    await page.waitForURL("**/forgot-password");

    // Enter email
    await page.fill('input[name="email"]', "test@example.com");
    await page.click('button[type="submit"]');

    // Should show success message
    await expect(page.locator("text=reset link has been sent")).toBeVisible();

    // Test with invalid email
    await page.fill('input[name="email"]', "invalid-email");
    await page.click('button[type="submit"]');
    await expect(page.locator("text=valid email")).toBeVisible();
  });

  test("Sign up flow with validation", async ({ page }) => {
    await page.goto("/en/sign-up");

    // Test empty form submission
    await page.click('button[type="submit"]');
    await expect(page.locator("text=Required").first()).toBeVisible();

    // Test password mismatch
    await page.fill('input[name="email"]', `test${Date.now()}@example.com`);
    await page.fill('input[name="password"]', "Password123!");
    await page.fill('input[name="confirmPassword"]', "Password456!");
    await page.click('button[type="submit"]');
    await expect(page.locator("text=Passwords do not match")).toBeVisible();

    // Test weak password
    await page.fill('input[name="password"]', "123");
    await page.fill('input[name="confirmPassword"]', "123");
    await page.click('button[type="submit"]');
    await expect(page.locator("text=at least 6 characters")).toBeVisible();

    // Test existing email
    await page.fill('input[name="email"]', "aloha@ixplor.app");
    await page.fill('input[name="password"]', "ValidPass123!");
    await page.fill('input[name="confirmPassword"]', "ValidPass123!");
    await page.click('button[type="submit"]');
    await expect(page.locator("text=already exists")).toBeVisible();
  });

  test("Session timeout handling", async ({ page, context }) => {
    // Sign in first
    await page.goto("/en/sign-in");
    await page.fill('[data-testid="email"]', "aloha@ixplor.app");
    await page.fill('[data-testid="password"]', "password");
    await page.click('[data-testid="sign-in-submit"]');
    await page.waitForURL("**/en");

    // Clear cookies to simulate session expiry
    await context.clearCookies();

    // Try to access protected route
    await page.goto("/en/restaurant/ingredients");

    // Should redirect to sign-in
    await expect(page).toHaveURL(/.*sign-in/);
    await expect(page.locator("text=session has expired")).toBeVisible();
  });

  test("Concurrent login attempts", async ({ page, context }) => {
    const page2 = await context.newPage();

    // Start login on both pages
    await page.goto("/en/sign-in");
    await page2.goto("/en/sign-in");

    // Fill forms on both
    await page.fill('[data-testid="email"]', "aloha@ixplor.app");
    await page.fill('[data-testid="password"]', "password");

    await page2.fill('[data-testid="email"]', "aloha@ixplor.app");
    await page2.fill('[data-testid="password"]', "password");

    // Submit both almost simultaneously
    await Promise.all([
      page.click('[data-testid="sign-in-submit"]'),
      page2.click('[data-testid="sign-in-submit"]'),
    ]);

    // Both should handle gracefully
    await page.waitForTimeout(2000);

    // At least one should be logged in
    const page1LoggedIn = (await page.url().includes("sign-in")) === false;
    const page2LoggedIn = (await page2.url().includes("sign-in")) === false;

    expect(page1LoggedIn || page2LoggedIn).toBeTruthy();

    await page2.close();
  });

  test("Email confirmation flow", async ({ page }) => {
    // This would require email access, so we test the UI flow
    await page.goto("/en/confirm-email");

    // Should show confirmation pending message
    await expect(page.locator("text=confirm your email")).toBeVisible();

    // Test resend functionality
    const resendButton = page.locator('button:has-text("Resend")');
    if (await resendButton.isVisible()) {
      await resendButton.click();
      await expect(page.locator("text=email has been sent")).toBeVisible();
    }
  });

  test("OAuth login flow", async ({ page }) => {
    await page.goto("/en/sign-in");

    // Check for Google login button
    const googleButton = page.locator(
      'button:has-text("Continue with Google")'
    );
    if (await googleButton.isVisible()) {
      // Click and verify redirect
      const [popup] = await Promise.all([
        page.waitForEvent("popup"),
        googleButton.click(),
      ]);

      // Verify popup URL contains Google OAuth
      expect(popup.url()).toContain("accounts.google.com");

      // Close popup
      await popup.close();
    }
  });

  test("Rate limiting on login attempts", async ({ page }) => {
    await page.goto("/en/sign-in");

    // Try multiple failed login attempts
    for (let i = 0; i < 6; i++) {
      await page.fill('[data-testid="email"]', "aloha@ixplor.app");
      await page.fill('[data-testid="password"]', "wrongpassword");
      await page.click('[data-testid="sign-in-submit"]');
      await page.waitForTimeout(500);
    }

    // Should show rate limit or account lock message
    const rateLimitMessage = page.locator("text=Too many attempts");
    const lockMessage = page.locator("text=account has been locked");

    await expect(rateLimitMessage.or(lockMessage)).toBeVisible();
  });

  test("Remember me functionality", async ({ page, context }) => {
    await page.goto("/en/sign-in");

    // Check remember me if available
    const rememberMe = page.locator('input[name="rememberMe"]');
    if (await rememberMe.isVisible()) {
      await rememberMe.check();
    }

    // Sign in
    await page.fill('[data-testid="email"]', "aloha@ixplor.app");
    await page.fill('[data-testid="password"]', "password");
    await page.click('[data-testid="sign-in-submit"]');
    await page.waitForURL("**/en");

    // Get cookies
    const cookies = await context.cookies();
    const authCookie = cookies.find(
      (c) => c.name.includes("auth") || c.name.includes("token")
    );

    if (authCookie && rememberMe) {
      // Cookie should have long expiry
      const expiryDate = new Date(authCookie.expires * 1000);
      const daysDiff =
        (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      expect(daysDiff).toBeGreaterThan(7); // At least a week
    }
  });

  test("Cross-site request forgery protection", async ({ page }) => {
    await page.goto("/en/sign-in");

    // Try to submit form without CSRF token
    const response = await page.evaluate(async () => {
      const formData = new FormData();
      formData.append("email", "test@example.com");
      formData.append("password", "password");

      const response = await fetch("/api/auth/login", {
        method: "POST",
        body: formData,
        credentials: "omit", // No cookies
      });

      return {
        status: response.status,
        ok: response.ok,
      };
    });

    // Should reject without proper CSRF protection
    expect(response.ok).toBeFalsy();
  });

  test("Password visibility toggle", async ({ page }) => {
    await page.goto("/en/sign-in");

    // Check initial state
    const passwordInput = page.locator('[data-testid="password"]');
    expect(await passwordInput.getAttribute("type")).toBe("password");

    // Look for visibility toggle
    const toggleButton = page.locator(
      '[data-testid="password-visibility-toggle"]'
    );
    if (await toggleButton.isVisible()) {
      await toggleButton.click();
      expect(await passwordInput.getAttribute("type")).toBe("text");

      // Toggle back
      await toggleButton.click();
      expect(await passwordInput.getAttribute("type")).toBe("password");
    }
  });
});

test.describe("Profile Management", () => {
  test.beforeEach(async ({ page }) => {
    // Sign in
    await page.goto("/en/sign-in");
    await page.fill('[data-testid="email"]', "aloha@ixplor.app");
    await page.fill('[data-testid="password"]', "password");
    await page.click('[data-testid="sign-in-submit"]');
    await page.waitForURL("**/en");
  });

  test("Update profile information", async ({ page }) => {
    await page.goto("/en/profile/edit");

    // Update basic info
    await page.fill('input[name="firstName"]', "Updated");
    await page.fill('input[name="lastName"]', "User");
    await page.fill('input[name="phone"]', "+1234567890");

    // Save changes
    await page.click('button:has-text("Save")');

    // Verify success message
    await expect(
      page.locator("text=Profile updated successfully")
    ).toBeVisible();

    // Verify changes persisted
    await page.reload();
    const firstName = await page
      .locator('input[name="firstName"]')
      .inputValue();
    expect(firstName).toBe("Updated");
  });

  test("Change email with confirmation", async ({ page }) => {
    await page.goto("/en/profile/edit");

    // Click change email
    const changeEmailButton = page.locator('button:has-text("Change Email")');
    if (await changeEmailButton.isVisible()) {
      await changeEmailButton.click();

      // Enter new email
      const newEmail = `newemail${Date.now()}@example.com`;
      await page.fill('input[name="newEmail"]', newEmail);
      await page.fill('input[name="password"]', "password");

      await page.click('button:has-text("Update Email")');

      // Should show confirmation required
      await expect(
        page.locator("text=confirmation email has been sent")
      ).toBeVisible();
    }
  });

  test("Change password validation", async ({ page }) => {
    await page.goto("/en/profile/edit");

    // Navigate to password change
    await page.click('button:has-text("Change Password")');

    // Test with wrong current password
    await page.fill('input[name="currentPassword"]', "wrongpassword");
    await page.fill('input[name="newPassword"]', "NewPass123!");
    await page.fill('input[name="confirmPassword"]', "NewPass123!");
    await page.click('button[type="submit"]');

    await expect(
      page.locator("text=Current password is incorrect")
    ).toBeVisible();

    // Test with mismatched new passwords
    await page.fill('input[name="currentPassword"]', "password");
    await page.fill('input[name="newPassword"]', "NewPass123!");
    await page.fill('input[name="confirmPassword"]', "DifferentPass123!");
    await page.click('button[type="submit"]');

    await expect(page.locator("text=Passwords do not match")).toBeVisible();

    // Test with weak password
    await page.fill('input[name="newPassword"]', "123");
    await page.fill('input[name="confirmPassword"]', "123");
    await page.click('button[type="submit"]');

    await expect(page.locator("text=Password must be at least")).toBeVisible();
  });

  test("Avatar upload", async ({ page }) => {
    await page.goto("/en/profile/edit");

    // Upload avatar
    const fileInput = page.locator('input[type="file"][accept*="image"]');
    if (await fileInput.isVisible()) {
      await fileInput.setInputFiles({
        name: "avatar.jpg",
        mimeType: "image/jpeg",
        buffer: Buffer.from("fake-image-content"),
      });

      // Should show preview
      await expect(page.locator('img[alt*="avatar"]')).toBeVisible();

      // Save
      await page.click('button:has-text("Save")');

      // Verify upload success
      await expect(page.locator("text=uploaded successfully")).toBeVisible();
    }
  });

  test("Delete account flow", async ({ page }) => {
    await page.goto("/en/profile/edit");

    // Look for delete account option
    const deleteButton = page.locator('button:has-text("Delete Account")');
    if (await deleteButton.isVisible()) {
      await deleteButton.click();

      // Should show confirmation dialog
      await expect(
        page.locator("text=This action cannot be undone")
      ).toBeVisible();

      // Require password confirmation
      await page.fill('input[name="confirmPassword"]', "password");

      // Type confirmation text if required
      const confirmText = page.locator('input[name="confirmText"]');
      if (await confirmText.isVisible()) {
        await confirmText.fill("DELETE");
      }

      // Cancel instead of confirming
      await page.click('button:has-text("Cancel")');

      // Should still be on profile page
      await expect(page).toHaveURL(/.*profile/);
    }
  });

  test("Language preference", async ({ page }) => {
    await page.goto("/en/profile/edit");

    // Look for language selector
    const languageSelect = page.locator('select[name="language"]');
    if (await languageSelect.isVisible()) {
      await languageSelect.selectOption("es"); // Spanish
      await page.click('button:has-text("Save")');

      // Page should reload with new language
      await page.waitForTimeout(1000);

      // URL should reflect language change
      expect(page.url()).toContain("/es/");
    }
  });

  test("Theme preference persistence", async ({ page }) => {
    await page.goto("/en/profile");

    // Get initial theme
    const htmlElement = page.locator("html");
    const initialTheme = await htmlElement.getAttribute(
      "data-mantine-color-scheme"
    );

    // Toggle theme
    await page.click('[data-testid="theme-switch-button"]');
    await page.waitForTimeout(500);

    // Verify theme changed
    const newTheme = await htmlElement.getAttribute(
      "data-mantine-color-scheme"
    );
    expect(newTheme).not.toBe(initialTheme);

    // Reload page
    await page.reload();

    // Theme should persist
    const persistedTheme = await htmlElement.getAttribute(
      "data-mantine-color-scheme"
    );
    expect(persistedTheme).toBe(newTheme);
  });
});
