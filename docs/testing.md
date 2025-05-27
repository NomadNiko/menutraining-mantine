# Testing

---

## Table of Contents <!-- omit in toc -->

- [Testing](#testing)
  - [Introduction](#introduction)
  - [Installation](#installation)
  - [Running tests](#running-tests)

---

## Introduction

This boilerplate uses [Playwright](https://playwright.dev/) for E2E testing.

## Installation

```bash
npx playwright install
```

## Running tests

1. Run development server

   ```bash
   npm run dev
   ```

2. Run Playwright

   ```bash
   # Run all tests
   npx playwright test

   # Run with UI mode for debugging
   npx playwright test --ui

   # Run specific test suites
   npm run test:auth      # Authentication tests
   npm run test:quiz      # Quiz functionality tests
   npm run test:restaurant # Restaurant data tests
   npm run test:demo      # Complete demo walkthrough
   ```

## Test Structure

Tests are organized by feature area:

```
playwright-tests/
├── auth/               # Authentication and user management
├── ingredients/        # Ingredient CRUD operations
├── menu-items/         # Menu item management
├── recipes/            # Recipe creation and editing
├── quiz/               # Quiz gameplay and configuration
├── admin/              # Admin panel functionality
├── demo/               # Full application walkthrough
└── helpers/            # Shared test utilities
```

## Writing Tests

### Best Practices

1. **Use data-testid attributes** for reliable element selection
2. **Wait for network idle** after navigation
3. **Handle debounced operations** with appropriate timeouts
4. **Test both success and error cases**
5. **Verify cache updates** after CRUD operations

### Example Test Structure

```typescript
import { test, expect } from "@playwright/test";
import { login } from "../helpers/auth";

test.describe("Feature Name", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("should perform specific action", async ({ page }) => {
    // Navigate to page
    await page.goto("/restaurant/recipes");

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Perform actions
    await page.click('[data-testid="create-button"]');

    // Assert results
    await expect(page.locator("h1")).toContainText("Create Recipe");
  });
});
```

## Recent Test Updates

With the new streamlined recipe workflow (January 2025), ensure tests cover:

1. **Instant Save on Creation**

   - Verify recipe is saved immediately
   - Check redirect to edit page
   - Ensure no data loss

2. **Auto-Save Functionality**

   - Test 3-second debounce timing
   - Verify save indicators appear
   - Check data persistence

3. **Visual Feedback**
   - "Saving..." indicator visibility
   - "Saved" confirmation display
   - Error state handling

---

Previous: [Auth](auth.md)

Next: [Forms](forms.md)
