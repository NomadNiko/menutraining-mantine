// src/utils/recipe-normalizer.ts
import { Recipe, RecipeStepItem } from "@/services/api/types/recipe";

/**
 * Normalizes a recipe step to ensure all optional arrays are properly initialized
 */
export function normalizeRecipeStep(step: RecipeStepItem): RecipeStepItem {
  return {
    ...step,
    stepEquipment: step.stepEquipment || [],
    stepIngredientItems: step.stepIngredientItems || [],
    stepImageUrl: step.stepImageUrl || null,
  };
}

/**
 * Normalizes a recipe to ensure all steps have properly initialized arrays
 */
export function normalizeRecipe(recipe: Recipe): Recipe {
  return {
    ...recipe,
    recipeSteps: recipe.recipeSteps.map(normalizeRecipeStep),
  };
}
