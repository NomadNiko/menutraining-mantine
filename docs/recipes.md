# Recipe Management

## Table of Contents <!-- omit in toc -->

- [Recipe Management](#recipe-management)
  - [Introduction](#introduction)
  - [Streamlined Recipe Workflow](#streamlined-recipe-workflow)
    - [Key Features](#key-features)
    - [Implementation Details](#implementation-details)
  - [Recipe Creation](#recipe-creation)
    - [Instant Save](#instant-save)
    - [Step Management](#step-management)
  - [Recipe Editing](#recipe-editing)
    - [Auto-Save Functionality](#auto-save-functionality)
    - [Visual Feedback](#visual-feedback)
  - [Technical Architecture](#technical-architecture)
    - [Routes](#routes)
    - [State Management](#state-management)
    - [API Integration](#api-integration)

## Introduction

The Recipe Management system in Menu Training Platform allows restaurant staff to create, edit, and manage recipes with detailed step-by-step instructions, equipment requirements, and ingredient measurements.

## Streamlined Recipe Workflow

As of January 2025, we've implemented a new streamlined workflow that significantly improves the user experience for recipe management.

### Key Features

1. **Instant Recipe Creation**: Recipes are saved immediately upon creation, eliminating data loss
2. **Incremental Step Addition**: Add steps one by one after the recipe is created
3. **Auto-Save**: Changes are automatically saved with a 3-second debounce
4. **Visual Save Indicators**: Clear feedback showing "Saving..." and "Saved" states
5. **Seamless Navigation**: Smooth transition between create and edit modes

### Implementation Details

The streamlined workflow uses two main routes:

- Create: `/restaurant/recipes/create-streamlined`
- Edit: `/restaurant/recipes/[id]/edit-streamlined`

## Recipe Creation

### Instant Save

When creating a new recipe:

1. User fills in basic recipe information (name, cook time, etc.)
2. Upon clicking "Create Recipe", the recipe is immediately saved to the database
3. User is redirected to the edit page where they can add steps
4. No data is lost if the user navigates away

### Step Management

After recipe creation:

- Steps can be added incrementally
- Each step includes ingredients, equipment, and instructions
- Steps are automatically numbered and can be reordered
- Changes are auto-saved as you type

## Recipe Editing

### Auto-Save Functionality

The auto-save feature:

- Triggers 3 seconds after the user stops typing
- Shows "Saving..." indicator during the save operation
- Displays "Saved" confirmation when complete
- Handles errors gracefully with user-friendly messages

### Visual Feedback

Save state indicators:

```typescript
// Example of save states
interface SaveState {
  isSaving: boolean;
  lastSaved: Date | null;
  hasChanges: boolean;
}
```

Visual indicators appear in the top-right corner of the form:

- 🔄 "Saving..." - Yellow indicator during save
- ✅ "Saved" - Green indicator when saved
- ❌ Error message if save fails

## Technical Architecture

### Routes

```typescript
// New streamlined routes
/restaurant/ceeiprs / create -
  streamlined / restaurant / recipes / [id] / edit -
  streamlined /
    // Legacy routes (still supported)
    restaurant /
    recipes /
    create /
    restaurant /
    recipes /
    [id] /
    edit;
```

### State Management

The recipe form uses React Hook Form with custom save logic:

```typescript
const useRecipeAutoSave = (recipeId: string) => {
  const [saveState, setSaveState] = useState<SaveState>({
    isSaving: false,
    lastSaved: null,
    hasChanges: false,
  });

  // Auto-save logic with debounce
  const debouncedSave = useDebouncedCallback(
    async (data: RecipeFormData) => {
      setSaveState((prev) => ({ ...prev, isSaving: true }));
      try {
        await updateRecipe(recipeId, data);
        setSaveState({
          isSaving: false,
          lastSaved: new Date(),
          hasChanges: false,
        });
      } catch (error) {
        // Handle error
      }
    },
    3000 // 3-second debounce
  );

  return { saveState, debouncedSave };
};
```

### API Integration

The recipe service handles:

- Creating recipes with immediate persistence
- Updating recipes with partial data
- Managing recipe steps independently
- Handling concurrent updates safely

---

Previous: [Forms](forms.md)

Next: [Testing](testing.md)
