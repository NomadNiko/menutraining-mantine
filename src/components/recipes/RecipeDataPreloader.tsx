// src/components/recipes/RecipeDataPreloader.tsx
"use client";
import { useEffect, useRef } from "react";
import { useGetRecipeService } from "@/services/api/services/recipes";
import { useGetIngredientService } from "@/services/api/services/ingredients";
import { useGetEquipmentItemService } from "@/services/api/services/equipment";
import { Recipe } from "@/services/api/types/recipe";
import { Ingredient } from "@/services/api/types/ingredient";
import { Equipment } from "@/services/api/types/equipment";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { normalizeRecipe } from "@/utils/recipe-normalizer";

// Define our cache structure with proper types
export interface RecipeCache {
  recipes: Record<string, Recipe>;
  ingredients: Record<string, Ingredient>;
  equipment: Record<string, Equipment>;
}

// Create a global cache object
const globalRecipeCache: RecipeCache = {
  recipes: {},
  ingredients: {},
  equipment: {},
};

// Hook to access the global cache
export function useRecipeCache(): RecipeCache {
  return globalRecipeCache;
}

interface RecipeDataPreloaderProps {
  recipes: Recipe[];
}

export function RecipeDataPreloader({ recipes }: RecipeDataPreloaderProps) {
  const isPreloading = useRef(false);
  const getRecipeService = useGetRecipeService();
  const getIngredientService = useGetIngredientService();
  const getEquipmentService = useGetEquipmentItemService();

  useEffect(() => {
    // Skip if already preloading or no recipes to preload
    if (isPreloading.current || !recipes.length) return;

    isPreloading.current = true;

    // Function to preload data for a single recipe
    const preloadRecipeData = async (recipe: Recipe) => {
      try {
        // Skip if we already have this recipe in cache with full details
        if (globalRecipeCache.recipes[recipe.recipeId]) return;

        // Store normalized recipe in cache
        globalRecipeCache.recipes[recipe.recipeId] = normalizeRecipe(recipe);

        // Collect all ingredient and equipment IDs from steps
        const ingredientIds = new Set<string>();
        const equipmentIds = new Set<string>();

        const normalizedRecipe = normalizeRecipe(recipe);
        normalizedRecipe.recipeSteps.forEach((step) => {
          // Add equipment IDs
          if (step.stepEquipment && step.stepEquipment.length > 0) {
            step.stepEquipment.forEach((eqId) => equipmentIds.add(eqId));
          }

          // Add ingredient IDs
          if (step.stepIngredientItems && step.stepIngredientItems.length > 0) {
            step.stepIngredientItems.forEach((item) =>
              ingredientIds.add(item.ingredientId)
            );
          }
        });

        // Preload all ingredients
        for (const ingredientId of Array.from(ingredientIds)) {
          // Skip if already cached
          if (globalRecipeCache.ingredients[ingredientId]) continue;

          try {
            const response = await getIngredientService({ ingredientId });
            if (response.status === HTTP_CODES_ENUM.OK) {
              globalRecipeCache.ingredients[ingredientId] = response.data;
            }
          } catch (error) {
            console.error(
              `Error preloading ingredient ${ingredientId}:`,
              error
            );
          }
        }

        // Preload all equipment
        for (const equipmentId of Array.from(equipmentIds)) {
          // Skip if already cached
          if (globalRecipeCache.equipment[equipmentId]) continue;

          try {
            const response = await getEquipmentService({ equipmentId });
            if (response.status === HTTP_CODES_ENUM.OK) {
              globalRecipeCache.equipment[equipmentId] = response.data;
            }
          } catch (error) {
            console.error(`Error preloading equipment ${equipmentId}:`, error);
          }
        }
      } catch (error) {
        console.error("Error preloading recipe data:", error);
      }
    };

    // Create a queue of recipes to preload
    const queue = [...recipes];

    // Process the queue with a throttled approach
    let processed = 0;
    const processNext = async () => {
      if (queue.length === 0 || processed >= recipes.length) {
        isPreloading.current = false;
        return;
      }

      const recipe = queue.shift();
      if (recipe) {
        await preloadRecipeData(recipe);
        processed++;
        // Small delay to prevent API rate limiting
        setTimeout(processNext, 100);
      }
    };

    // Start processing the queue
    processNext();

    // Cleanup function
    return () => {
      isPreloading.current = false;
    };
  }, [recipes, getRecipeService, getIngredientService, getEquipmentService]);

  // This component doesn't render anything
  return null;
}
