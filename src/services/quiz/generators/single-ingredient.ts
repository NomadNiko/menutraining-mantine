// src/services/quiz/generators/single-ingredient.ts
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
  menuItemContainsIngredient,
} from "./utils";

/**
 * Generates a question for single-ingredient menu items
 * This creates a "Which menu item contains [ingredient]?" question
 * Now considers sub-ingredients when determining ingredient presence and uses difficulty settings
 */
export function generateSingleIngredientQuestion(
  menuItem: MenuItem,
  correctIngredient: AnswerOption,
  allIngredients: Ingredient[],
  allMenuItems: MenuItem[],
  difficulty: Difficulty = Difficulty.MEDIUM
): QuizQuestion | null {
  try {
    // Early validation
    if (!correctIngredient || !allMenuItems.length) {
      return null;
    }

    const settings = DIFFICULTY_SETTINGS[difficulty];

    // Filter other menu items efficiently - those that don't contain this ingredient
    // Now using sub-ingredient aware checking
    const otherMenuItems: MenuItem[] = [];
    for (const item of allMenuItems) {
      if (
        item.id !== menuItem.id &&
        !menuItemContainsIngredient(item, correctIngredient.id, allIngredients)
      ) {
        otherMenuItems.push(item);
      }
    }

    // Calculate required counts based on difficulty
    // For single ingredient questions, we always have 1 correct answer
    const correctCount = 1;
    const incorrectCount = settings.totalChoices - correctCount;

    // Early validation - ensure we have enough incorrect options
    if (otherMenuItems.length < incorrectCount) {
      return null;
    }

    const incorrectMenuItems = getRandomSubset(otherMenuItems, incorrectCount);

    // Create options from menu items
    const correctOption = {
      id: menuItem.id,
      text: menuItem.menuItemName,
    };

    const incorrectOptions = incorrectMenuItems.map((item) => ({
      id: item.id,
      text: item.menuItemName,
    }));

    // Ensure we have the right total number of options
    if (1 + incorrectOptions.length !== settings.totalChoices) {
      return null;
    }

    // Combine and shuffle options
    const allOptions = combineAndShuffleOptions(
      [correctOption],
      incorrectOptions
    );

    return {
      id: `q_single_${menuItem.id}`,
      type: QuestionType.INGREDIENTS_IN_DISH, // Reusing same type for consistency
      questionText: `Which menu item contains ${correctIngredient.text}?`,
      imageUrl: null, // No image for this question type
      options: allOptions,
      correctAnswerIds: [correctOption.id],
    };
  } catch (error) {
    console.error("Error generating single-ingredient question:", error);
    return null;
  }
}
