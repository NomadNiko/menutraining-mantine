// src/services/quiz/generators/menu-item-contains-ingredient.ts
import { QuizQuestion, QuestionType } from "../types";
import { MenuItem } from "@/services/api/types/menu-item";
import { Ingredient } from "@/services/api/types/ingredient";
import { getRandomSubset, getMenuItemAllIngredientIds } from "./utils";

/**
 * Generates a true/false question about whether a menu item contains a specific ingredient
 * Now considers sub-ingredients recursively
 */
export function generateMenuItemContainsIngredientQuestion(
  menuItem: MenuItem,
  allIngredients: Ingredient[]
): QuizQuestion | null {
  try {
    // Early validation
    if (!menuItem.menuItemIngredients.length || !allIngredients.length) {
      return null;
    }

    // Get all ingredient IDs that this menu item contains (including sub-ingredients)
    const menuItemAllIngredientIds = getMenuItemAllIngredientIds(
      menuItem,
      allIngredients
    );

    // Separate ingredients that are in the menu item vs those that aren't
    const ingredientsInItem: Ingredient[] = [];
    const ingredientsNotInItem: Ingredient[] = [];

    for (const ingredient of allIngredients) {
      if (menuItemAllIngredientIds.has(ingredient.ingredientId)) {
        ingredientsInItem.push(ingredient);
      } else {
        ingredientsNotInItem.push(ingredient);
      }
    }

    // We need at least one ingredient in each category to create a good question
    if (ingredientsInItem.length === 0 || ingredientsNotInItem.length === 0) {
      return null;
    }

    // Randomly decide whether to ask about an ingredient that IS in the item (50/50 chance)
    const askAboutIngredientInItem = Math.random() < 0.5;

    let selectedIngredient: Ingredient;
    let correctAnswer: boolean;

    if (askAboutIngredientInItem) {
      // Ask about an ingredient that IS in the menu item (directly or through sub-ingredients)
      selectedIngredient = getRandomSubset(ingredientsInItem, 1)[0];
      correctAnswer = true;
    } else {
      // Ask about an ingredient that is NOT in the menu item
      selectedIngredient = getRandomSubset(ingredientsNotInItem, 1)[0];
      correctAnswer = false;
    }

    // Create the true/false options
    const options = [
      { id: "true", text: "True" },
      { id: "false", text: "False" },
    ];

    return {
      id: `q_contains_${menuItem.id}_${selectedIngredient.ingredientId}`,
      type: QuestionType.MENU_ITEM_CONTAINS_INGREDIENT,
      questionText: `Does "${menuItem.menuItemName}" contain ${selectedIngredient.ingredientName}?`,
      imageUrl: menuItem.menuItemUrl,
      options,
      correctAnswerIds: [correctAnswer ? "true" : "false"],
      isSingleChoice: true, // Add this line to mark as single choice
    };
  } catch (error) {
    console.error(
      "Error generating menu item contains ingredient question:",
      error
    );
    return null;
  }
}
