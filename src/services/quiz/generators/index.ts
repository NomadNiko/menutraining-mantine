// src/services/quiz/generators/index.ts
/**
 * Question generators module index
 *
 * This file exports all question generators and utility functions
 */

// Export utility functions (including new sub-ingredient utilities)
export * from "./utils";

// Export individual generators
export { generateIngredientsWithAllergyQuestion } from "./ingredients-with-allergy";
export { generateIngredientsInDishQuestion } from "./ingredients-in-dish";
export { generateSingleIngredientQuestion } from "./single-ingredient";
export { generateMenuItemContainsIngredientQuestion } from "./menu-item-contains-ingredient";
export { generateIngredientContainsAllergyQuestion } from "./ingredient-contains-allergy";
export { generateMenuItemContainsAllergyQuestion } from "./menu-item-contains-allergy";
export { generateWhichMenuItemIsThisQuestion } from "./which-menu-item-is-this"; // New export
