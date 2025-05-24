# Menu Training Application - Playwright Tests

This directory contains the end-to-end tests for the Menu Training application using Playwright.

## Test Structure

```
playwright-tests/
├── auth/               # Authentication tests
├── demo/               # Complete application demo/walkthrough
├── quiz/               # Quiz functionality tests
├── restaurant/         # Restaurant data management tests
├── helpers/            # Shared test utilities
└── screenshots/        # Test screenshots output
```

## Running Tests

### Prerequisites
- Make sure both frontend and backend are running:
  ```bash
  # Backend (in menutraining-server directory)
  yarn start
  
  # Frontend (in menutraining-mantine directory)
  yarn start
  ```

### Run all tests
```bash
npm test
```

### Run specific test suites
```bash
# Run demo tests
npm run test:demo

# Run quiz tests
npm run test:quiz

# Run authentication tests
npm run test:auth

# Run restaurant data tests
npm run test:restaurant
```

### Run tests with UI (interactive mode)
```bash
npm run test:ui
```

## Test Accounts

The tests use the following account:
- Email: `aloha@ixplor.app`
- Password: `password`
- Restaurant: Nikos Place (RST-000001)

## Test Categories

### Authentication Tests (`auth/`)
- User login/logout
- Protected route access
- Profile page access
- Invalid credentials handling

### Quiz Tests (`quiz/`)
- Quiz configuration options
- Difficulty level selection
- High scores display
- Quiz gameplay flow
- Question and answer interaction

### Restaurant Data Tests (`restaurant/`)
- Ingredients page data display
- Menu items management
- Recipes access
- Menu sections
- Restaurant context persistence

### Demo Tests (`demo/`)
- Complete application walkthrough
- Screenshot generation for documentation
- Feature verification
- End-to-end user journey

## Writing New Tests

1. Use the helper functions from `helpers/` for common operations:
   ```typescript
   import { login } from '../helpers/auth';
   import { ROUTES } from '../helpers/navigation';
   ```

2. Follow the existing test structure:
   ```typescript
   test.describe('Feature Name', () => {
     test.beforeEach(async ({ page }) => {
       await login(page);
     });
     
     test('specific test case', async ({ page }) => {
       // Test implementation
     });
   });
   ```

3. Use meaningful test descriptions and assertions
4. Take screenshots for important states
5. Handle async operations properly with appropriate waits

## Debugging

- Use `page.pause()` to pause execution during debugging
- Run with `--debug` flag for step-by-step debugging
- Check `playwright-report/` for test failure details
- Screenshots are saved in `playwright-tests/screenshots/`