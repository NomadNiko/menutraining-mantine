// ./menutraining-mantine/src/services/quiz/question-generator.ts
// src/services/quiz/question-generator.ts
import {
  QuizQuestion,
  AnswerOption,
  QuestionGeneratorResult,
  RestaurantData,
  QuestionType,
  Difficulty,
} from "./types";
import { MenuItem } from "@/services/api/types/menu-item";
import { Ingredient } from "@/services/api/types/ingredient";
import { Allergy } from "@/services/api/types/allergy";

// Import question generators
import { generateIngredientsWithAllergyQuestion } from "./generators/ingredients-with-allergy";
import { generateIngredientsInDishQuestion } from "./generators/ingredients-in-dish";
import { generateSingleIngredientQuestion } from "./generators/single-ingredient";
import { generateMenuItemContainsIngredientQuestion } from "./generators/menu-item-contains-ingredient";
import { generateIngredientContainsAllergyQuestion } from "./generators/ingredient-contains-allergy";
import { generateMenuItemContainsAllergyQuestion } from "./generators/menu-item-contains-allergy";
import { generateWhichMenuItemIsThisQuestion } from "./generators/which-menu-item-is-this"; // New import

// Import utilities
import { shuffleArray } from "./generators/utils";

/**
 * Generates questions for the quiz efficiently by generating only the required number
 * instead of pre-generating all possible questions.
 */
export async function generateQuizQuestions(
  restaurantData: RestaurantData,
  questionCount: number,
  questionTypes: QuestionType[] = Object.values(QuestionType),
  difficulty: Difficulty = Difficulty.MEDIUM
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

    // Validate question types
    const useAllergyQuestions = questionTypes.includes(
      QuestionType.INGREDIENTS_WITH_ALLERGY
    );
    const useDishQuestions = questionTypes.includes(
      QuestionType.INGREDIENTS_IN_DISH
    );
    const useContainsQuestions = questionTypes.includes(
      QuestionType.MENU_ITEM_CONTAINS_INGREDIENT
    );
    const useIngredientAllergyQuestions = questionTypes.includes(
      QuestionType.INGREDIENT_CONTAINS_ALLERGY
    );
    const useMenuItemAllergyQuestions = questionTypes.includes(
      QuestionType.MENU_ITEM_CONTAINS_ALLERGY
    );
    const useWhichMenuItemQuestions = questionTypes.includes(
      QuestionType.WHICH_MENU_ITEM_IS_THIS
    );

    if (
      !useAllergyQuestions &&
      !useDishQuestions &&
      !useContainsQuestions &&
      !useIngredientAllergyQuestions &&
      !useMenuItemAllergyQuestions &&
      !useWhichMenuItemQuestions
    ) {
      return {
        questions: [],
        error: "No question types selected",
      };
    }

    console.log(
      `Generating ${questionCount} questions with difficulty: ${difficulty}`
    );

    // Pre-process data for efficiency
    const { multiIngredientItems, singleIngredientItems, allergies } =
      preprocessData(restaurantData);

    console.log(
      `Preprocessed: ${multiIngredientItems.length} multi-ingredient items, ` +
        `${singleIngredientItems.length} single-ingredient items, ` +
        `${allergies.length} allergies`
    );

    // Calculate how many questions to generate per type
    const enabledTypeCount = [
      useAllergyQuestions && allergies.length > 0,
      useDishQuestions &&
        (multiIngredientItems.length > 0 || singleIngredientItems.length > 0),
      useContainsQuestions && restaurantData.menuItems.length > 0,
      useIngredientAllergyQuestions &&
        Object.keys(restaurantData.allergies).length > 0,
      useMenuItemAllergyQuestions &&
        Object.keys(restaurantData.allergies).length > 0,
      useWhichMenuItemQuestions && restaurantData.menuItems.length > 0,
    ].filter(Boolean).length;

    if (enabledTypeCount === 0) {
      return {
        questions: [],
        error: "No valid question types available for this restaurant data",
      };
    }

    // Generate exactly what we need
    const questions: QuizQuestion[] = [];
    const questionsPerType = Math.max(
      1,
      Math.ceil(questionCount / enabledTypeCount)
    );

    // Track which question types are available
    const availableGenerators: Array<() => QuizQuestion[]> = [];

    if (useAllergyQuestions && allergies.length > 0) {
      availableGenerators.push(() =>
        generateLimitedAllergyQuestions(
          allergies,
          restaurantData.ingredients,
          difficulty,
          questionsPerType
        )
      );
    }

    if (
      useDishQuestions &&
      (multiIngredientItems.length > 0 || singleIngredientItems.length > 0)
    ) {
      availableGenerators.push(() =>
        generateLimitedMenuItemQuestions(
          multiIngredientItems,
          singleIngredientItems,
          restaurantData,
          difficulty,
          questionsPerType
        )
      );
    }

    if (useContainsQuestions && restaurantData.menuItems.length > 0) {
      availableGenerators.push(() =>
        generateLimitedContainsQuestions(
          restaurantData.menuItems,
          restaurantData.ingredients,
          questionsPerType
        )
      );
    }

    if (
      useIngredientAllergyQuestions &&
      Object.keys(restaurantData.allergies).length > 0
    ) {
      availableGenerators.push(() =>
        generateLimitedIngredientAllergyQuestions(
          restaurantData.ingredients,
          restaurantData.allergies,
          questionsPerType
        )
      );
    }

    if (
      useMenuItemAllergyQuestions &&
      Object.keys(restaurantData.allergies).length > 0
    ) {
      availableGenerators.push(() =>
        generateLimitedMenuItemAllergyQuestions(
          restaurantData.menuItems,
          restaurantData.ingredients,
          restaurantData.allergies,
          questionsPerType
        )
      );
    }

    if (useWhichMenuItemQuestions && restaurantData.menuItems.length > 0) {
      availableGenerators.push(() =>
        generateLimitedWhichMenuItemQuestions(
          restaurantData.menuItems,
          difficulty,
          questionsPerType
        )
      );
    }

    // Generate questions from each generator
    let generatorIndex = 0;
    let attempts = 0;
    const maxAttempts = availableGenerators.length * 3;

    while (questions.length < questionCount && attempts < maxAttempts) {
      const generator =
        availableGenerators[generatorIndex % availableGenerators.length];
      const newQuestions = generator();

      // Add only the questions we need to reach the target
      const questionsNeeded = questionCount - questions.length;
      questions.push(...newQuestions.slice(0, questionsNeeded));

      generatorIndex++;
      attempts++;
    }

    console.log(`Generated ${questions.length} questions`);

    if (questions.length === 0) {
      return {
        questions: [],
        error: "No valid questions could be generated",
      };
    }

    // Shuffle and limit to requested count
    const shuffledQuestions = shuffleArray(questions);
    const selectedQuestions = shuffledQuestions.slice(0, questionCount);

    console.log(`Final selection: ${selectedQuestions.length} questions`);

    return {
      questions: selectedQuestions,
      error:
        selectedQuestions.length === 0
          ? "Failed to generate any questions"
          : undefined,
    };
  } catch (error) {
    console.error("Error generating quiz questions:", error);
    return {
      questions: [],
      error: "Failed to generate questions",
    };
  }
}

/**
 * Pre-process restaurant data for efficient question generation
 */
function preprocessData(restaurantData: RestaurantData) {
  // Get all menu items with their ingredients mapped
  const menuItemsWithIngredients = restaurantData.menuItems.map((menuItem) => {
    const ingredients = menuItem.menuItemIngredients
      .map((id) =>
        restaurantData.ingredients.find((ing) => ing.ingredientId === id)
      )
      .filter((ing): ing is Ingredient => ing !== undefined)
      .map((ing) => ({
        id: ing.ingredientId,
        text: ing.ingredientName,
      }));

    return { menuItem, ingredients };
  });

  // Split by ingredient count for efficient processing
  const multiIngredientItems = menuItemsWithIngredients.filter(
    (item) => item.ingredients.length >= 2
  );
  const singleIngredientItems = menuItemsWithIngredients.filter(
    (item) => item.ingredients.length === 1
  );

  // Get allergies array
  const allergies = Object.values(restaurantData.allergies);

  return {
    multiIngredientItems,
    singleIngredientItems,
    allergies,
  };
}

/**
 * Generate limited allergy questions efficiently
 */
function generateLimitedAllergyQuestions(
  allergies: Allergy[],
  ingredients: Ingredient[],
  difficulty: Difficulty,
  maxQuestions: number
): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  const shuffledAllergies = shuffleArray([...allergies]);

  for (let i = 0; i < Math.min(maxQuestions, shuffledAllergies.length); i++) {
    const question = generateIngredientsWithAllergyQuestion(
      shuffledAllergies[i],
      ingredients,
      difficulty
    );
    if (question) {
      questions.push(question);
    }
  }
  return questions;
}

/**
 * Generate limited menu item questions efficiently
 */
function generateLimitedMenuItemQuestions(
  multiIngredientItems: Array<{
    menuItem: MenuItem;
    ingredients: AnswerOption[];
  }>,
  singleIngredientItems: Array<{
    menuItem: MenuItem;
    ingredients: AnswerOption[];
  }>,
  restaurantData: RestaurantData,
  difficulty: Difficulty,
  maxQuestions: number
): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  const allItems = [...multiIngredientItems, ...singleIngredientItems];
  const shuffledItems = shuffleArray(allItems);

  for (let i = 0; i < Math.min(maxQuestions, shuffledItems.length); i++) {
    const { menuItem, ingredients } = shuffledItems[i];

    let question: QuizQuestion | null = null;
    if (ingredients.length >= 2) {
      question = generateIngredientsInDishQuestion(
        menuItem,
        ingredients,
        restaurantData.ingredients,
        difficulty
      );
    } else if (ingredients.length === 1) {
      question = generateSingleIngredientQuestion(
        menuItem,
        ingredients[0],
        restaurantData.ingredients,
        restaurantData.menuItems,
        difficulty
      );
    }

    if (question) {
      questions.push(question);
    }
  }

  return questions;
}

/**
 * Generate limited true/false contains questions efficiently
 */
function generateLimitedContainsQuestions(
  menuItems: MenuItem[],
  ingredients: Ingredient[],
  maxQuestions: number
): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  const shuffledMenuItems = shuffleArray([...menuItems]);

  for (let i = 0; i < Math.min(maxQuestions, shuffledMenuItems.length); i++) {
    const question = generateMenuItemContainsIngredientQuestion(
      shuffledMenuItems[i],
      ingredients
    );
    if (question) {
      questions.push(question);
    }
  }

  return questions;
}

/**
 * Generate limited ingredient allergy questions efficiently
 */
function generateLimitedIngredientAllergyQuestions(
  ingredients: Ingredient[],
  allergies: Record<string, Allergy>,
  maxQuestions: number
): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  let attempts = 0;
  const maxAttempts = maxQuestions * 2;

  while (questions.length < maxQuestions && attempts < maxAttempts) {
    const question = generateIngredientContainsAllergyQuestion(
      ingredients,
      allergies
    );
    if (question) {
      questions.push(question);
    }
    attempts++;
  }

  return questions;
}

/**
 * Generate limited menu item allergy questions efficiently
 */
function generateLimitedMenuItemAllergyQuestions(
  menuItems: MenuItem[],
  ingredients: Ingredient[],
  allergies: Record<string, Allergy>,
  maxQuestions: number
): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  let attempts = 0;
  const maxAttempts = maxQuestions * 2;

  while (questions.length < maxQuestions && attempts < maxAttempts) {
    const question = generateMenuItemContainsAllergyQuestion(
      menuItems,
      ingredients,
      allergies
    );
    if (question) {
      questions.push(question);
    }
    attempts++;
  }

  return questions;
}

/**
 * Generate limited "which menu item is this" questions efficiently
 */
function generateLimitedWhichMenuItemQuestions(
  menuItems: MenuItem[],
  difficulty: Difficulty,
  maxQuestions: number
): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  const usedMenuItemIds = new Set<string>();

  // Try to generate up to maxQuestions, with retry logic
  let attempts = 0;
  const maxAttempts = maxQuestions * 2;

  while (questions.length < maxQuestions && attempts < maxAttempts) {
    const question = generateWhichMenuItemIsThisQuestion(menuItems, difficulty);
    if (question && question.imageUrl) {
      // Check if we haven't already used this menu item
      const menuItemId = question.correctAnswerIds[0];
      if (!usedMenuItemIds.has(menuItemId)) {
        questions.push(question);
        usedMenuItemIds.add(menuItemId);
      }
    }
    attempts++;
  }

  return questions;
}

// Re-export generators and utilities for direct access
export * from "./generators/utils";
export { generateIngredientsWithAllergyQuestion } from "./generators/ingredients-with-allergy";
export { generateIngredientsInDishQuestion } from "./generators/ingredients-in-dish";
export { generateSingleIngredientQuestion } from "./generators/single-ingredient";
export { generateMenuItemContainsIngredientQuestion } from "./generators/menu-item-contains-ingredient";
export { generateIngredientContainsAllergyQuestion } from "./generators/ingredient-contains-allergy";
export { generateMenuItemContainsAllergyQuestion } from "./generators/menu-item-contains-allergy";
export { generateWhichMenuItemIsThisQuestion } from "./generators/which-menu-item-is-this"; // New export
