// src/services/quiz/generators/ingredient-or-menu-item-contains-allergy.ts
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
 * Generates a true/false question about whether an ingredient or menu item contains a specific allergy
 */
export function generateIngredientOrMenuItemContainsAllergyQuestion(
  allIngredients: Ingredient[],
  allMenuItems: MenuItem[],
  allergies: Record<string, Allergy>
): QuizQuestion | null {
  try {
    // Early validation
    if (
      !allIngredients.length ||
      !allMenuItems.length ||
      !Object.keys(allergies).length
    ) {
      return null;
    }

    const allergyList = Object.values(allergies);

    // Randomly decide whether to ask about an ingredient or menu item (50/50 chance)
    const askAboutIngredient = Math.random() < 0.5;

    // Select a random allergy
    const selectedAllergy = getRandomSubset(allergyList, 1)[0];

    let questionText: string;
    let imageUrl: string | null = null;
    let correctAnswer: boolean;
    let entityName: string;

    if (askAboutIngredient) {
      // Ask about an ingredient
      const selectedIngredient = getRandomSubset(allIngredients, 1)[0];
      const ingredientAllergies = getIngredientAllAllergies(
        selectedIngredient,
        allIngredients
      );

      correctAnswer = ingredientAllergies.has(selectedAllergy.allergyId);
      entityName = selectedIngredient.ingredientName;
      imageUrl = selectedIngredient.ingredientImageUrl || null;
      questionText = `Does "${entityName}" contain the ${selectedAllergy.allergyName} allergy?`;
    } else {
      // Ask about a menu item
      const selectedMenuItem = getRandomSubset(allMenuItems, 1)[0];
      correctAnswer = menuItemContainsAllergy(
        selectedMenuItem,
        selectedAllergy.allergyId,
        allIngredients
      );
      entityName = selectedMenuItem.menuItemName;
      imageUrl = selectedMenuItem.menuItemUrl || null;
      questionText = `Does "${entityName}" contain the ${selectedAllergy.allergyName} allergy?`;
    }

    // Create the true/false options
    const options = [
      { id: "true", text: "True" },
      { id: "false", text: "False" },
    ];

    return {
      id: `q_allergy_contains_${Date.now()}_${Math.random()}`,
      type: QuestionType.INGREDIENT_OR_MENU_ITEM_CONTAINS_ALLERGY,
      questionText,
      imageUrl,
      options,
      correctAnswerIds: [correctAnswer ? "true" : "false"],
      isSingleChoice: true, // Mark as single choice
    };
  } catch (error) {
    console.error(
      "Error generating ingredient/menu item contains allergy question:",
      error
    );
    return null;
  }
}
