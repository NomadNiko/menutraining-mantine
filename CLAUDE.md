# Claude.md - Project Context for AI Assistant

## Project Overview

This is a restaurant menu training application built with Next.js, Mantine UI, and NestJS backend.

## Important Development Workflow

1. **ALWAYS run prettier before building**: `npx prettier --write "src/**/*.{ts,tsx}"`
2. **Run lint check**: `yarn lint`
3. **Run build**: `yarn build`

## Key Commands

- Frontend prettier fix: `npx prettier --write "src/**/*.{ts,tsx}"`
- Frontend lint: `yarn lint`
- Frontend build: `yarn build`
- Frontend dev: `yarn dev`
- Run tests: `yarn test`
- Run Playwright tests: `npx playwright test`

## PM2 Services

- Frontend: `pm2 restart mantine-frontend`
- Backend: `pm2 restart menutraining-backend`

## Environment

- Frontend runs on port 3000
- Backend API runs on port 3001 with `/api` prefix
- API URL: `http://localhost:3001/api`

## Testing Credentials

- Default test user: `aloha@ixplor.app` / `password`
- Admin user: `admin@example.com` / `secret`

## Project Structure

- Frontend: `/home/ubuntu/dev/menutraining-mantine`
- Backend: `/home/ubuntu/dev/menutraining-server`

## Recent Development Changes (January 2025)

### Streamlined Recipe Creation Workflow

- **New Routes**:
  - Create: `/restaurant/recipes/create-streamlined`
  - Edit: `/restaurant/recipes/[id]/edit-streamlined`
- **Key Features**:
  - Instant save on recipe creation
  - Step-by-step editing after creation
  - Auto-save with 3-second debounce
  - Visual feedback for save states
  - Improved UX with immediate persistence

### Implementation Details

- Recipe is saved immediately upon creation
- Steps can be added incrementally after recipe exists
- Auto-save triggers on form changes with debounce
- Save state indicators show "Saving..." and "Saved"
- Form validation ensures data integrity
