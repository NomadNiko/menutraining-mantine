// src/services/api/types/recipe.ts
export type Recipe = {
  id: string;
  recipeId: string;
  recipeName: string;
  recipeDescription?: string | null;
  recipeImageUrl?: string | null;
  recipeServings: number;
  recipePrepTime: number;
  recipeTotalTime: number;
  recipeSteps: RecipeStepItem[];
  restaurantId: string;
};

export type RecipeStepItem = {
  stepText: string;
  stepEquipment?: string[];
  stepIngredientItems?: StepIngredientItem[];
  stepImageUrl?: string | null;
  order: number;
};

export type StepIngredientItem = {
  ingredientId: string;
  ingredientMeasure?: string;
  ingredientUnits: number;
};

export type CreateRecipeDto = {
  recipeName: string;
  recipeDescription?: string | null;
  recipeImageUrl?: string | null;
  recipeServings: number;
  recipePrepTime: number;
  recipeTotalTime: number;
  recipeSteps: CreateRecipeStepItemDto[];
  restaurantId: string;
};

export type CreateRecipeStepItemDto = {
  stepText: string;
  stepEquipment?: string[];
  stepIngredientItems?: CreateStepIngredientItemDto[];
  stepImageUrl?: string | null;
  order?: number;
};

export type CreateStepIngredientItemDto = {
  ingredientId: string;
  ingredientMeasure?: string;
  ingredientUnits: number;
};

export type UpdateRecipeDto = Partial<CreateRecipeDto>;

export type QueryRecipeDto = {
  page?: number;
  limit?: number;
  name?: string;
  restaurantId?: string;
  ingredientId?: string;
  equipmentId?: string;
  maxPrepTime?: number;
};
