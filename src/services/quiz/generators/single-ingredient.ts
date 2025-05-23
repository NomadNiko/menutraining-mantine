// src/services/quiz/generators/single-ingredient.ts
import { QuizQuestion, QuestionType, AnswerOption } from "../types";
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
 * Now considers sub-ingredients when determining ingredient presence
 */
export function generateSingleIngredientQuestion(
  menuItem: MenuItem,
  correctIngredient: AnswerOption,
  allIngredients: Ingredient[],
  allMenuItems: MenuItem[]
): QuizQuestion | null {
  try {
    // Early validation
    if (!correctIngredient || !allMenuItems.length) {
      return null;
    }

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

    if (otherMenuItems.length < 3) {
      return null;
    }

    // Get 3-4 incorrect menu items
    const incorrectCount = Math.min(
      otherMenuItems.length,
      Math.floor(Math.random() * 2) + 3 // 3-4 incorrect answers
    );
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
