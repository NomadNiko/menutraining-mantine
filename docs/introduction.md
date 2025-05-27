# Introduction

---

## Table of Contents <!-- omit in toc -->

- [Introduction](#introduction)
  - [Description](#description)
  - [Features](#features)
  - [Screenshots](#screenshots)
  - [Purpose](#purpose)
  - [Recent Updates](#recent-updates)

---

## Description

Menu Training Platform - A comprehensive restaurant management and interactive staff training system.

Built for restaurants to efficiently manage their menu data and train staff through engaging quizzes that test knowledge of ingredients, allergens, recipes, and menu items.

Backend: [Menu Training Server](https://github.com/brocoders/nestjs-boilerplate)

## Features

### Core Technology

- [x] Next.js 14 with App Router
- [x] TypeScript for type safety
- [x] [Mantine UI](https://mantine.dev/) - Modern React components library
- [x] [React Hook Form](https://react-hook-form.com/) with Yup validation
- [x] React Query for server state management
- [x] [i18n](https://react.i18next.com/) internationalization support
- [x] JWT Authentication with refresh tokens
- [x] E2E tests with [Playwright](https://playwright.dev/)

### Restaurant Management Features

- [x] **Ingredients Management** - Track ingredients with allergen info and categories
- [x] **Menu Items** - Create dishes with ingredients, pricing, and descriptions
- [x] **Recipe Management** - Step-by-step instructions with equipment tracking
- [x] **Menu Organization** - Structure items into sections (Breakfast, Lunch, etc.)
- [x] **Allergen Tracking** - Comprehensive allergen management for safety

### Training System Features

- [x] **Interactive Quizzes** - Auto-generated from restaurant data
- [x] **Difficulty Levels** - Easy, Medium, Hard, and Custom modes
- [x] **Progress Tracking** - Real-time scoring and analytics
- [x] **Leaderboards** - Restaurant-specific high scores
- [x] **Multiple Question Types** - Test various aspects of menu knowledge

### User & System Features

- [x] **Multi-Restaurant Support** - Manage multiple locations
- [x] **Role-Based Access** - Admin and staff permissions
- [x] **Dark Mode** - Toggle between light and dark themes
- [x] **Responsive Design** - Works on desktop, tablet, and mobile
- [x] **File Upload** - S3-compatible storage for images

---

## Screenshots

### Authentication

![Sign In](../images/sign-in.png)
_Clean, modern sign-in interface with Google OAuth support_

### Dashboard

![Dashboard](../images/dashboard.png)
_Restaurant dashboard showing key metrics and quick actions_

### Ingredient Management

![Ingredients](../images/ingredients.png)
_Comprehensive ingredient tracking with allergen information_

### Menu Items

![Menu Items](../images/menu-items.png)
_Detailed menu item management with pricing and ingredients_

### Recipe Management

![Recipes](../images/recipes.png)
_Step-by-step recipe creation with equipment tracking_

### Quiz System

![Quiz Configuration](../images/quiz-config.png)
_Configure quiz difficulty and settings_

![Quiz Question](../images/quiz-question.png)
_Interactive quiz questions testing menu knowledge_

---

## Purpose

Menu Training Platform addresses critical challenges in the restaurant industry:

### The Problem

- **Staff Training**: New employees need to quickly learn menu items, ingredients, and allergens
- **Food Safety**: Critical allergen information must be accurately communicated
- **Consistency**: Multiple locations need standardized training
- **Engagement**: Traditional training methods are often boring and ineffective

### Our Solution

- **Interactive Learning**: Gamified quizzes make training engaging and fun
- **Comprehensive Data**: All menu information in one centralized system
- **Real-time Updates**: Changes to menu items instantly reflected in training
- **Progress Tracking**: Managers can monitor staff knowledge and improvement
- **Multi-location Support**: Perfect for restaurant chains and franchises

## Recent Updates

### January 2025 - Streamlined Recipe Workflow

We've revolutionized how recipes are created and managed:

#### 🚀 Instant Recipe Creation

- Recipes save immediately upon creation - no more lost data!
- Seamless transition from create to edit mode
- Add steps incrementally after the recipe exists

#### 💾 Auto-Save Functionality

- Changes automatically save after 3 seconds of inactivity
- Visual indicators show "Saving..." and "Saved" states
- No more manual save buttons or lost work

#### 🎨 Enhanced User Experience

- Cleaner, more intuitive interface
- Better error handling and validation
- Smooth navigation between recipe sections

#### 🔧 Technical Improvements

- Optimized API calls with debouncing
- Better TypeScript type coverage
- Improved form state management
- Enhanced error recovery

---

Previous: [Main](README.md)

Next: [Installing and Running](installing-and-running.md)
