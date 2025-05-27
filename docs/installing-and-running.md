# Installing and Running

---

## Table of Contents <!-- omit in toc -->

- [Installing and Running](#installing-and-running)
  - [Requirements](#requirements)
  - [Installation](#installation)
    - [Frontend Setup](#frontend-setup)
    - [Backend Setup](#backend-setup)
  - [Environment Configuration](#environment-configuration)
  - [Running the Application](#running-the-application)
    - [Development Mode](#development-mode)
    - [Production Build](#production-build)
  - [Development Guidelines](#development-guidelines)
    - [Code Standards](#code-standards)
    - [Architecture Overview](#architecture-overview)
    - [Development Workflow](#development-workflow)
  - [Common Issues](#common-issues)

---

## Requirements

- **Node.js 18+** (recommended: use [nvm](https://github.com/nvm-sh/nvm) for version management)
- **Yarn** package manager (preferred) or npm
- **Git** for version control
- **Backend Server** - Menu Training backend must be running

## Installation

### Frontend Setup

1. Clone the repository

   ```bash
   git clone <repository-url>
   cd menutraining-mantine
   ```

2. Install dependencies

   ```bash
   yarn install
   # or
   npm install
   ```

3. Copy environment configuration

   ```bash
   cp example.env.local .env.local
   ```

### Backend Setup

The Menu Training backend must be running for the frontend to work properly.

1. Clone the backend repository

   ```bash
   cd ..
   git clone <backend-repository-url>
   cd menutraining-server
   ```

2. Install backend dependencies

   ```bash
   yarn install
   ```

3. Configure backend environment

   ```bash
   cp env-example-document .env
   ```

4. Run the backend server

   ```bash
   yarn start
   ```

The backend will run on `http://localhost:3001` by default.

## Environment Configuration

Edit `.env.local` with your configuration:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Authentication
NEXT_PUBLIC_IS_SIGN_UP_ENABLED=true
NEXT_PUBLIC_IS_GOOGLE_AUTH_ENABLED=true
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id

# File Storage
NEXT_PUBLIC_FILE_DRIVER=s3

# Optional: Analytics, monitoring, etc.
```

## Running the Application

### Development Mode

```bash
# Run the development server
yarn dev
# or
npm run dev
```

The application will be available at `http://localhost:3000`

### Production Build

```bash
# Build for production
yarn build

# Run production server
yarn start
```

### Other Commands

```bash
# Run linting
yarn lint

# Fix linting issues
yarn lint:fix

# Format code with Prettier
npx prettier --write "src/**/*.{ts,tsx}"

# Run E2E tests
npm test

# Run tests with UI
npm run test:ui
```

## Development Guidelines

### Code Standards

1. **Always run prettier before committing**:

   ```bash
   npx prettier --write "src/**/*.{ts,tsx}"
   ```

2. **Run lint checks**:

   ```bash
   yarn lint
   ```

3. **Build before pushing**:
   ```bash
   yarn build
   ```

### Architecture Overview

1. **Frontend Stack**:

   - **Framework**: Next.js 14 with App Router
   - **UI Library**: Mantine UI
   - **State Management**: React Query for server state
   - **Forms**: React Hook Form with Yup validation
   - **Styling**: CSS Modules and Mantine theme system

2. **Key Directories**:

   - `src/app/[language]/` - Page routes with i18n support
   - `src/components/` - Reusable UI components
   - `src/services/` - Business logic and API calls
   - `src/hooks/` - Custom React hooks

3. **Testing**:
   - E2E tests use Playwright
   - Run tests before major changes
   - Add tests for new features

### Development Workflow

1. **Feature Development**:

   - Create feature branch from main
   - Implement feature following existing patterns
   - Add/update tests as needed
   - Run prettier and lint
   - Build to check for errors
   - Submit PR with clear description

2. **API Integration**:

   - All API calls go through service layer
   - Use React Query for data fetching
   - Handle loading and error states
   - Implement proper TypeScript types

3. **Component Development**:
   - Use Mantine UI components as base
   - Create reusable components in `components/`
   - Follow existing naming conventions
   - Add proper TypeScript interfaces

## Common Issues

### Build Errors

1. **TypeScript errors**: Run `yarn build` to see detailed errors
2. **Lint errors**: Run `yarn lint:fix` to auto-fix most issues
3. **Import errors**: Check that all imports use correct paths

### Runtime Issues

1. **API Connection Failed**:

   - Ensure backend is running on port 3001
   - Check `NEXT_PUBLIC_API_URL` in `.env.local`
   - Verify no CORS issues

2. **Authentication Issues**:

   - Clear browser localStorage
   - Check JWT token expiration
   - Verify backend auth configuration

3. **Slow Performance**:
   - Pages may take 4-6 seconds on first load in dev mode
   - This is normal for Next.js development
   - Production builds are much faster

### Testing Issues

1. **Playwright timeouts**:

   - Increase timeout in test files
   - Ensure both frontend and backend are running
   - Check for slow page loads in dev mode

2. **Test data conflicts**:
   - Use unique test data for each test
   - Clean up after tests complete
   - Check for race conditions

---

Previous: [Introduction](introduction.md)

Next: [Architecture](architecture.md)
