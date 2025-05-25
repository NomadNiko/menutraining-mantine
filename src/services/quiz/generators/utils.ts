// src/services/quiz/generators/utils.ts
/**
 * Utility functions for quiz question generators
 */
import { AnswerOption } from "../types";
import { Ingredient } from "@/services/api/types/ingredient";
import { MenuItem } from "@/services/api/types/menu-item";

/**
 * Shuffles an array using the Fisher-Yates algorithm
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Gets a random subset of items from an array
 */
export function getRandomSubset<T>(array: T[], count: number): T[] {
  if (!array.length) return [];
  if (array.length <= count) return [...array];
  const shuffled = shuffleArray(array);
  return shuffled.slice(0, count);
}

/**
 * Creates a standardized answer option from an object with id and text properties
 */
export function createAnswerOption(obj: {
  id: string;
  text: string;
}): AnswerOption {
  return {
    id: obj.id,
    text: obj.text,
  };
}

/**
 * Combines and shuffles correct and incorrect options
 */
export function combineAndShuffleOptions(
  correctOptions: AnswerOption[],
  incorrectOptions: AnswerOption[]
): AnswerOption[] {
  return shuffleArray([...correctOptions, ...incorrectOptions]);
}

// Cache for expanded ingredient IDs to avoid recomputation
const expandedIngredientCache = new Map<string, Set<string>>();

/**
 * Recursively expands ingredient IDs to include all sub-ingredients (with caching)
 * @param ingredientIds Array of ingredient IDs to expand
 * @param allIngredients Array of all available ingredients
 * @param visited Set to prevent infinite recursion
 * @returns Set of all ingredient IDs (original + sub-ingredients)
 */
export function expandIngredientIds(
  ingredientIds: string[],
  allIngredients: Ingredient[],
  visited: Set<string> = new Set()
): Set<string> {
  // Create cache key
  const cacheKey = `${ingredientIds.sort().join(",")}_${allIngredients.length}`;

  // Check cache first
  if (expandedIngredientCache.has(cacheKey)) {
    return new Set(expandedIngredientCache.get(cacheKey)!);
  }

  const expandedIds = new Set<string>();

  // Create a map for faster lookups
  const ingredientMap = new Map<string, Ingredient>();
  allIngredients.forEach((ingredient) => {
    ingredientMap.set(ingredient.ingredientId, ingredient);
  });

  const expandRecursively = (ingredientId: string) => {
    // Prevent infinite recursion
    if (visited.has(ingredientId)) {
      return;
    }
    visited.add(ingredientId);

    // Add the current ingredient
    expandedIds.add(ingredientId);

    // Find the ingredient and expand its sub-ingredients
    const ingredient = ingredientMap.get(ingredientId);
    if (
      ingredient &&
      ingredient.subIngredients &&
      ingredient.subIngredients.length > 0
    ) {
      ingredient.subIngredients.forEach((subIngredientId) => {
        expandRecursively(subIngredientId);
      });
    }
  };

  // Expand each ingredient ID
  ingredientIds.forEach(expandRecursively);

  // Cache the result
  expandedIngredientCache.set(cacheKey, new Set(expandedIds));

  return expandedIds;
}

/**
 * Gets all ingredient IDs that a menu item contains (including sub-ingredients)
 * @param menuItem The menu item to analyze
 * @param allIngredients Array of all available ingredients
 * @returns Set of all ingredient IDs the menu item contains
 */
export function getMenuItemAllIngredientIds(
  menuItem: MenuItem,
  allIngredients: Ingredient[]
): Set<string> {
  return expandIngredientIds(menuItem.menuItemIngredients, allIngredients);
}

/**
 * Checks if a menu item contains a specific ingredient (including through sub-ingredients)
 * @param menuItem The menu item to check
 * @param ingredientId The ingredient ID to look for
 * @param allIngredients Array of all available ingredients
 * @returns True if the menu item contains the ingredient (directly or through sub-ingredients)
 */
export function menuItemContainsIngredient(
  menuItem: MenuItem,
  ingredientId: string,
  allIngredients: Ingredient[]
): boolean {
  const allIngredientIds = getMenuItemAllIngredientIds(
    menuItem,
    allIngredients
  );
  return allIngredientIds.has(ingredientId);
}
