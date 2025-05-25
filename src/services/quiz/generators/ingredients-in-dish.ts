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
import { getRandomSubset, combineAndShuffleOptions } from "./utils";

/**
 * Generates a question about ingredients in a dish (SIMPLIFIED for speed)
 */
export function generateIngredientsInDishQuestion(
  menuItem: MenuItem,
  correctIngredients: AnswerOption[],
  allIngredients: Ingredient[],
  difficulty: Difficulty = Difficulty.MEDIUM
): QuizQuestion | null {
  try {
    // Early validation
    if (!correctIngredients.length || allIngredients.length < 4) {
      return null;
    }

    const settings = DIFFICULTY_SETTINGS[difficulty];

    // SIMPLIFIED: Use direct menu item ingredients without expensive sub-ingredient expansion
    const menuItemIngredientIds = new Set(menuItem.menuItemIngredients);

    // Use only the provided correct ingredients (no expensive lookups)
    const validCorrectIngredients = correctIngredients.filter((ingredient) =>
      menuItemIngredientIds.has(ingredient.id)
    );

    if (validCorrectIngredients.length === 0) {
      return null;
    }

    // SIMPLIFIED: Quick incorrect ingredient selection
    const incorrectIngredients: AnswerOption[] = [];
    for (
      let i = 0;
      i < allIngredients.length && incorrectIngredients.length < 20;
      i++
    ) {
      const ingredient = allIngredients[i];
      if (!menuItemIngredientIds.has(ingredient.ingredientId)) {
        incorrectIngredients.push({
          id: ingredient.ingredientId,
          text: ingredient.ingredientName,
        });
      }
    }

    if (incorrectIngredients.length < 2) {
      return null;
    }

    // SIMPLIFIED: Use fixed counts based on difficulty
    const correctCount = Math.min(2, validCorrectIngredients.length);
    const incorrectCount = settings.totalChoices - correctCount;

    const selectedCorrect = getRandomSubset(
      validCorrectIngredients,
      correctCount
    );
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
