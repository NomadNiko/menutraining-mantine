// src/services/quiz/generators/single-ingredient.ts
import { QuizQuestion, QuestionType, AnswerOption } from "../types";
import { MenuItem } from "@/services/api/types/menu-item";
import { Ingredient } from "@/services/api/types/ingredient";
import { getRandomSubset, combineAndShuffleOptions } from "./utils";

/**
 * Generates a question for single-ingredient menu items
 * This creates a "Which menu item contains [ingredient]?" question
 */
export function generateSingleIngredientQuestion(
  menuItem: MenuItem,
  correctIngredient: AnswerOption,
  allIngredients: Ingredient[],
  allMenuItems: MenuItem[]
): QuizQuestion | null {
  try {
    // For single-ingredient items, we change the question format to:
    // "Which menu item contains [ingredient]?"
    // First, get other menu items that don't contain this ingredient
    const otherMenuItems = allMenuItems.filter(
      (item) =>
        item.id !== menuItem.id &&
        !item.menuItemIngredients.includes(correctIngredient.id)
    );

    if (otherMenuItems.length < 3) {
      console.log("Not enough other menu items to create a valid question");
      return null;
    }

    // Limit to maximum 5 total options (1 correct + up to 4 incorrect) to stay within 6 options
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
