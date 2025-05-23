// src/services/quiz/generators/ingredients-in-dish.ts
import {
  QuizQuestion,
  QuestionType,
  AnswerOption,
  Difficulty,
  DIFFICULTY_SETTINGS,
} from "../types";
import { MenuItem } from "@/services/api/types/menu-item";
import { Ingredient } from "@/services/api/types/ingredient";
import {
  getRandomSubset,
  combineAndShuffleOptions,
  getMenuItemAllIngredientIds,
} from "./utils";

/**
 * Generates a question about ingredients in a dish (for multi-ingredient items)
 * Now considers sub-ingredients when building correct answers and uses difficulty settings
 */
export function generateIngredientsInDishQuestion(
  menuItem: MenuItem,
  correctIngredients: AnswerOption[],
  allIngredients: Ingredient[],
  difficulty: Difficulty = Difficulty.MEDIUM
): QuizQuestion | null {
  try {
    // Early validation
    if (!correctIngredients.length || !allIngredients.length) {
      return null;
    }

    const settings = DIFFICULTY_SETTINGS[difficulty];

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

    // Calculate required counts based on difficulty
    const minCorrectNeeded = settings.minCorrect;
    const maxCorrectAllowed = Math.min(
      settings.maxCorrect,
      allCorrectIngredients.length
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

    // Determine actual correct count within difficulty constraints
    const correctCount = Math.min(
      allCorrectIngredients.length,
      Math.max(
        minCorrectNeeded,
        Math.floor(Math.random() * (maxCorrectAllowed - minCorrectNeeded + 1)) +
          minCorrectNeeded
      )
    );

    // Calculate incorrect count to reach total choices
    const incorrectCount = settings.totalChoices - correctCount;
    const minIncorrectNeeded = incorrectCount;

    // Early validation - ensure we have enough incorrect options
    if (incorrectIngredients.length < minIncorrectNeeded) {
      return null;
    }

    const selectedCorrect = getRandomSubset(
      allCorrectIngredients,
      correctCount
    );

    const selectedIncorrect = getRandomSubset(
      incorrectIngredients,
      incorrectCount
    );

    // Ensure we have the right total number of options
    if (
      selectedCorrect.length + selectedIncorrect.length !==
      settings.totalChoices
    ) {
      return null;
    }

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
