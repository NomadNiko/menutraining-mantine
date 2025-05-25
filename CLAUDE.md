# Claude.md - Project Context for AI Assistant

## Project Overview
This is a restaurant menu training application built with Next.js, Mantine UI, and NestJS backend.

## Important Development Workflow
1. **ALWAYS run prettier before building**: `npx prettier --write "src/**/*.{ts,tsx}"`
2. **Run lint check**: `npm run lint`
3. **Run build**: `npm run build`

## Key Commands
- Frontend prettier fix: `npx prettier --write "src/**/*.{ts,tsx}"`
- Frontend lint: `npm run lint`
- Frontend build: `npm run build`
- Frontend dev: `npm run dev`
- Run tests: `npm test`
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