// src/services/quiz/generators/ingredients-in-dish.ts
import { QuizQuestion, QuestionType, AnswerOption } from "../types";
import { MenuItem } from "@/services/api/types/menu-item";
import { Ingredient } from "@/services/api/types/ingredient";
import { getRandomSubset, combineAndShuffleOptions } from "./utils";

/**
 * Generates a question about ingredients in a dish (for multi-ingredient items)
 */
export function generateIngredientsInDishQuestion(
  menuItem: MenuItem,
  correctIngredients: AnswerOption[],
  allIngredients: Ingredient[]
): QuizQuestion | null {
  try {
    // Get 2-3 correct ingredients (or all if fewer)
    const correctCount = Math.min(
      correctIngredients.length,
      Math.floor(Math.random() * 2) + 2 // 2-3 correct answers
    );
    const selectedCorrect = getRandomSubset(correctIngredients, correctCount);

    // Get incorrect options (ingredients not in the dish)
    const incorrectIngredients = allIngredients
      .filter((ing) => !menuItem.menuItemIngredients.includes(ing.ingredientId))
      .map((ing) => ({
        id: ing.ingredientId,
        text: ing.ingredientName,
      }));

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
