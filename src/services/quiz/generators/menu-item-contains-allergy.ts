// src/services/quiz/generators/menu-item-contains-allergy.ts
import { QuizQuestion, QuestionType } from "../types";
import { MenuItem } from "@/services/api/types/menu-item";
import { Ingredient } from "@/services/api/types/ingredient";
import { Allergy } from "@/services/api/types/allergy";
import { getRandomSubset, getMenuItemAllIngredientIds } from "./utils";

/**
 * Gets all allergies for an ingredient, including allergies from sub-ingredients
 * @param ingredient The ingredient to check
 * @param allIngredients Array of all available ingredients
 * @param visited Set to prevent infinite recursion
 * @returns Set of all allergy IDs
 */
function getIngredientAllAllergies(
  ingredient: Ingredient,
  allIngredients: Ingredient[],
  visited: Set<string> = new Set()
): Set<string> {
  const allAllergies = new Set<string>();

  // Prevent infinite recursion
  if (visited.has(ingredient.ingredientId)) {
    return allAllergies;
  }
  visited.add(ingredient.ingredientId);

  // Add direct allergies
  if (ingredient.ingredientAllergies) {
    ingredient.ingredientAllergies.forEach((allergyId) =>
      allAllergies.add(allergyId)
    );
  }

  // Add derived allergies (if they exist in the data model)
  if (ingredient.derivedAllergies) {
    ingredient.derivedAllergies.forEach((allergyId) =>
      allAllergies.add(allergyId)
    );
  }

  // Add allergies from sub-ingredients
  if (ingredient.subIngredients && ingredient.subIngredients.length > 0) {
    const ingredientMap = new Map<string, Ingredient>();
    allIngredients.forEach((ing) => {
      ingredientMap.set(ing.ingredientId, ing);
    });

    ingredient.subIngredients.forEach((subIngredientId) => {
      const subIngredient = ingredientMap.get(subIngredientId);
      if (subIngredient) {
        const subAllergies = getIngredientAllAllergies(
          subIngredient,
          allIngredients,
          visited
        );
        subAllergies.forEach((allergyId) => allAllergies.add(allergyId));
      }
    });
  }

  return allAllergies;
}

/**
 * Checks if a menu item contains a specific allergy
 * @param menuItem The menu item to check
 * @param allergyId The allergy ID to look for
 * @param allIngredients Array of all available ingredients
 * @returns True if the menu item contains the allergy
 */
function menuItemContainsAllergy(
  menuItem: MenuItem,
  allergyId: string,
  allIngredients: Ingredient[]
): boolean {
  const menuItemIngredientIds = getMenuItemAllIngredientIds(
    menuItem,
    allIngredients
  );

  // Check if any of the menu item's ingredients contain the allergy
  for (const ingredient of allIngredients) {
    if (menuItemIngredientIds.has(ingredient.ingredientId)) {
      const ingredientAllergies = getIngredientAllAllergies(
        ingredient,
        allIngredients
      );
      if (ingredientAllergies.has(allergyId)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Generates a true/false question about whether a menu item contains a specific allergy
 */
export function generateMenuItemContainsAllergyQuestion(
  allMenuItems: MenuItem[],
  allIngredients: Ingredient[],
  allergies: Record<string, Allergy>
): QuizQuestion | null {
  try {
    // Early validation
    if (
      !allMenuItems.length ||
      !allIngredients.length ||
      !Object.keys(allergies).length
    ) {
      return null;
    }

    const allergyList = Object.values(allergies);

    // Select a random allergy
    const selectedAllergy = getRandomSubset(allergyList, 1)[0];

    // Select a random menu item
    const selectedMenuItem = getRandomSubset(allMenuItems, 1)[0];

    // Check if the menu item contains this allergy
    const correctAnswer = menuItemContainsAllergy(
      selectedMenuItem,
      selectedAllergy.allergyId,
      allIngredients
    );

    const questionText = `Does "${selectedMenuItem.menuItemName}" contain the ${selectedAllergy.allergyName} allergy?`;

    // Create the true/false options
    const options = [
      { id: "true", text: "True" },
      { id: "false", text: "False" },
    ];

    return {
      id: `q_menu_item_allergy_${Date.now()}_${Math.random()}`,
      type: QuestionType.MENU_ITEM_CONTAINS_ALLERGY,
      questionText,
      imageUrl: selectedMenuItem.menuItemUrl || null,
      options,
      correctAnswerIds: [correctAnswer ? "true" : "false"],
      isSingleChoice: true,
    };
  } catch (error) {
    console.error(
      "Error generating menu item contains allergy question:",
      error
    );
    return null;
  }
}
