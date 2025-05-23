// src/services/quiz/generators/ingredients-in-dish.ts
import { QuizQuestion, QuestionType, AnswerOption } from "../types";
import { MenuItem } from "@/services/api/types/menu-item";
import { Ingredient } from "@/services/api/types/ingredient";
import {
  getRandomSubset,
  combineAndShuffleOptions,
  getMenuItemAllIngredientIds,
} from "./utils";

/**
 * Generates a question about ingredients in a dish (for multi-ingredient items)
 * Now considers sub-ingredients when building correct answers
 */
export function generateIngredientsInDishQuestion(
  menuItem: MenuItem,
  correctIngredients: AnswerOption[],
  allIngredients: Ingredient[]
): QuizQuestion | null {
  try {
    // Early validation
    if (!correctIngredients.length || !allIngredients.length) {
      return null;
    }

    // Get all ingredient IDs that this menu item contains (including sub-ingredients)
    const menuItemAllIngredientIds = getMenuItemAllIngredientIds(
      menuItem,
      allIngredients
    );

    // Filter correctIngredients to only include those that are actually in the menu item
    // This ensures we don't show incorrect "correct" answers
    const actualCorrectIngredients = correctIngredients.filter((ingredient) =>
      menuItemAllIngredientIds.has(ingredient.id)
    );

    // Also add any ingredients from allIngredients that are in the menu item but not in correctIngredients
    const additionalCorrectIngredients: AnswerOption[] = [];
    for (const ingredient of allIngredients) {
      if (
        menuItemAllIngredientIds.has(ingredient.ingredientId) &&
        !correctIngredients.some((ci) => ci.id === ingredient.ingredientId)
      ) {
        additionalCorrectIngredients.push({
          id: ingredient.ingredientId,
          text: ingredient.ingredientName,
        });
      }
    }

    // Combine all correct ingredients
    const allCorrectIngredients = [
      ...actualCorrectIngredients,
      ...additionalCorrectIngredients,
    ];

    if (allCorrectIngredients.length === 0) {
      return null;
    }

    // Get 2-3 correct ingredients (or all if fewer)
    const correctCount = Math.min(
      allCorrectIngredients.length,
      Math.floor(Math.random() * 2) + 2 // 2-3 correct answers
    );
    const selectedCorrect = getRandomSubset(
      allCorrectIngredients,
      correctCount
    );

    // Filter incorrect ingredients efficiently - those NOT in the menu item
    const incorrectIngredients: AnswerOption[] = [];
    for (const ingredient of allIngredients) {
      if (!menuItemAllIngredientIds.has(ingredient.ingredientId)) {
        incorrectIngredients.push({
          id: ingredient.ingredientId,
          text: ingredient.ingredientName,
        });
      }
    }

    // Get 3-4 incorrect ingredients
    const incorrectCount = Math.min(
      incorrectIngredients.length,
      6 - correctCount // Ensure we have at most 6 total options
    );
    if (incorrectCount < 1) {
      // Not enough incorrect options to make a good question
      return null;
    }

    const selectedIncorrect = getRandomSubset(
      incorrectIngredients,
      incorrectCount
    );

    // Combine and shuffle options
    const allOptions = combineAndShuffleOptions(
      selectedCorrect,
      selectedIncorrect
    );

    return {
      id: `q_${menuItem.id}`,
      type: QuestionType.INGREDIENTS_IN_DISH,
      questionText: `Which ingredients are in ${menuItem.menuItemName}?`,
      imageUrl: menuItem.menuItemUrl,
      options: allOptions,
      correctAnswerIds: selectedCorrect.map((ing) => ing.id),
    };
  } catch (error) {
    console.error("Error generating ingredients in dish question:", error);
    return null;
  }
}
