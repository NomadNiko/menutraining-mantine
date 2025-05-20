// src/services/quiz/question-generator.ts
import {
  QuestionType,
  QuizQuestion,
  AnswerOption,
  QuestionGeneratorResult,
  RestaurantData,
} from "./types";
import { MenuItem } from "@/services/api/types/menu-item";
import { Ingredient } from "@/services/api/types/ingredient";

/**
 * Shuffles an array using the Fisher-Yates algorithm
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Gets a random subset of items from an array
 */
export function getRandomSubset<T>(array: T[], count: number): T[] {
  if (!array.length) return [];
  if (array.length <= count) return [...array];

  const shuffled = shuffleArray(array);
  return shuffled.slice(0, count);
}

/**
 * Generates questions for the quiz
 */
export async function generateQuizQuestions(
  restaurantData: RestaurantData,
  questionCount: number
): Promise<QuestionGeneratorResult> {
  try {
    if (
      !restaurantData.menuItems.length ||
      !restaurantData.ingredients.length
    ) {
      return {
        questions: [],
        error: "Not enough data to generate questions",
      };
    }

    const questions: QuizQuestion[] = [];
    const availableMenuItems = [...restaurantData.menuItems];

    // Generate questions until we reach the count or run out of menu items
    while (questions.length < questionCount && availableMenuItems.length > 0) {
      // Get a random menu item and remove it from available items
      const randomIndex = Math.floor(Math.random() * availableMenuItems.length);
      const menuItem = availableMenuItems.splice(randomIndex, 1)[0];

      // Get ingredient details for this menu item
      const menuItemIngredients = menuItem.menuItemIngredients
        .map((id) =>
          restaurantData.ingredients.find((ing) => ing.ingredientId === id)
        )
        .filter((ing): ing is Ingredient => ing !== undefined) // Type guard to filter out undefined
        .map((ing) => ({
          id: ing.ingredientId,
          text: ing.ingredientName,
        }));

      // Ensure we have enough ingredients to create a meaningful question
      if (menuItemIngredients.length < 2) continue;

      // Generate a question about ingredients in this dish
      const question = generateIngredientsInDishQuestion(
        menuItem,
        menuItemIngredients,
        restaurantData.ingredients
      );

      if (question) {
        questions.push(question);
      }
    }

    if (questions.length === 0) {
      return {
        questions: [],
        error: "Could not generate any valid questions",
      };
    }

    return { questions };
  } catch (error) {
    console.error("Error generating quiz questions:", error);
    return {
      questions: [],
      error: "Failed to generate questions",
    };
  }
}

/**
 * Generates a question about ingredients in a dish
 */
function generateIngredientsInDishQuestion(
  menuItem: MenuItem,
  correctIngredients: AnswerOption[],
  allIngredients: Ingredient[]
): QuizQuestion | null {
  try {
    // Get 3-4 correct ingredients (or all if fewer)
    const correctCount = Math.min(
      correctIngredients.length,
      Math.floor(Math.random() * 2) + 3 // 3-4 correct answers
    );
    const selectedCorrect = getRandomSubset(correctIngredients, correctCount);

    // Get incorrect options (ingredients not in the dish)
    const incorrectIngredients = allIngredients
      .filter((ing) => !menuItem.menuItemIngredients.includes(ing.ingredientId))
      .map((ing) => ({
        id: ing.ingredientId,
        text: ing.ingredientName,
      }));

    // Get 4-5 incorrect ingredients
    const incorrectCount = Math.min(
      incorrectIngredients.length,
      8 - correctCount // Ensure we have at most 8 total options
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
    const allOptions = shuffleArray([...selectedCorrect, ...selectedIncorrect]);

    return {
      id: `q_${menuItem.id}`,
      type: QuestionType.INGREDIENTS_IN_DISH,
      questionText: `Which ingredients are in ${menuItem.menuItemName}?`,
      imageUrl: menuItem.menuItemUrl,
      options: allOptions,
      correctAnswerIds: selectedCorrect.map((ing) => ing.id),
    };
  } catch (error) {
    console.error("Error generating question:", error);
    return null;
  }
}
