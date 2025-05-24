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
 * Generates questions for the quiz efficiently by pre-generating all possible questions
 * and then selecting the required number.
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
    ); // New question type check

    if (
      !useAllergyQuestions &&
      !useDishQuestions &&
      !useContainsQuestions &&
      !useIngredientAllergyQuestions &&
      !useMenuItemAllergyQuestions &&
      !useWhichMenuItemQuestions // Added to validation
    ) {
      return {
        questions: [],
        error: "No question types selected",
      };
    }

    console.log(
      `Generating up to ${questionCount} questions with difficulty: ${difficulty}`
    );

    // Pre-process data for efficiency
    const { multiIngredientItems, singleIngredientItems, allergies } =
      preprocessData(restaurantData);

    console.log(
      `Preprocessed: ${multiIngredientItems.length} multi-ingredient items, ` +
        `${singleIngredientItems.length} single-ingredient items, ` +
        `${allergies.length} allergies`
    );

    // Generate all possible questions efficiently
    const allPossibleQuestions: QuizQuestion[] = [];

    // Generate allergy questions if requested
    if (useAllergyQuestions && allergies.length > 0) {
      const allergyQuestions = generateAllergyQuestions(
        allergies,
        restaurantData.ingredients,
        difficulty
      );
      allPossibleQuestions.push(...allergyQuestions);
    }

    // Generate menu item questions if requested
    if (
      useDishQuestions &&
      (multiIngredientItems.length > 0 || singleIngredientItems.length > 0)
    ) {
      const menuItemQuestions = generateMenuItemQuestions(
        multiIngredientItems,
        singleIngredientItems,
        restaurantData,
        difficulty
      );
      allPossibleQuestions.push(...menuItemQuestions);
    }

    // Generate true/false contains questions if requested
    if (useContainsQuestions && restaurantData.menuItems.length > 0) {
      const containsQuestions = generateContainsQuestions(
        restaurantData.menuItems,
        restaurantData.ingredients
      );
      allPossibleQuestions.push(...containsQuestions);
    }

    // Generate ingredient allergy questions if requested
    if (
      useIngredientAllergyQuestions &&
      Object.keys(restaurantData.allergies).length > 0
    ) {
      const ingredientAllergyQuestions = generateIngredientAllergyQuestions(
        restaurantData.ingredients,
        restaurantData.allergies
      );
      allPossibleQuestions.push(...ingredientAllergyQuestions);
    }

    // Generate menu item allergy questions if requested
    if (
      useMenuItemAllergyQuestions &&
      Object.keys(restaurantData.allergies).length > 0
    ) {
      const menuItemAllergyQuestions = generateMenuItemAllergyQuestions(
        restaurantData.menuItems,
        restaurantData.ingredients,
        restaurantData.allergies
      );
      allPossibleQuestions.push(...menuItemAllergyQuestions);
    }

    // Generate "which menu item is this" questions if requested
    if (useWhichMenuItemQuestions && restaurantData.menuItems.length > 0) {
      const whichMenuItemQuestions = generateWhichMenuItemQuestions(
        restaurantData.menuItems,
        difficulty
      );
      allPossibleQuestions.push(...whichMenuItemQuestions);
    }

    console.log(
      `Generated ${allPossibleQuestions.length} total possible questions`
    );

    if (allPossibleQuestions.length === 0) {
      return {
        questions: [],
        error: "No valid questions could be generated",
      };
    }

    // Shuffle and select the required number of questions
    const shuffledQuestions = shuffleArray(allPossibleQuestions);
    let selectedQuestions = shuffledQuestions.slice(0, questionCount);

    // If we need more questions than we have unique ones, duplicate some
    if (
      selectedQuestions.length < questionCount &&
      allPossibleQuestions.length > 0
    ) {
      console.log(
        `Need ${questionCount} questions but only have ${selectedQuestions.length} unique ones. Duplicating...`
      );
      selectedQuestions = extendQuestionsWithDuplicates(
        allPossibleQuestions,
        questionCount
      );
    }

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
 * Generate all possible allergy questions efficiently
 */
function generateAllergyQuestions(
  allergies: Allergy[],
  ingredients: Ingredient[],
  difficulty: Difficulty
): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  for (const allergy of allergies) {
    const question = generateIngredientsWithAllergyQuestion(
      allergy,
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
 * Generate all possible menu item questions efficiently
 */
function generateMenuItemQuestions(
  multiIngredientItems: Array<{
    menuItem: MenuItem;
    ingredients: AnswerOption[];
  }>,
  singleIngredientItems: Array<{
    menuItem: MenuItem;
    ingredients: AnswerOption[];
  }>,
  restaurantData: RestaurantData,
  difficulty: Difficulty
): QuizQuestion[] {
  const questions: QuizQuestion[] = [];

  // Generate questions for multi-ingredient items
  for (const { menuItem, ingredients } of multiIngredientItems) {
    const question = generateIngredientsInDishQuestion(
      menuItem,
      ingredients,
      restaurantData.ingredients,
      difficulty
    );
    if (question) {
      questions.push(question);
    }
  }

  // Generate questions for single-ingredient items
  for (const { menuItem, ingredients } of singleIngredientItems) {
    if (ingredients.length === 1) {
      const question = generateSingleIngredientQuestion(
        menuItem,
        ingredients[0],
        restaurantData.ingredients,
        restaurantData.menuItems,
        difficulty
      );
      if (question) {
        questions.push(question);
      }
    }
  }

  return questions;
}

/**
 * Generate all possible true/false contains questions efficiently
 */
function generateContainsQuestions(
  menuItems: MenuItem[],
  ingredients: Ingredient[]
): QuizQuestion[] {
  const questions: QuizQuestion[] = [];

  // Generate multiple questions per menu item to increase variety
  for (const menuItem of menuItems) {
    // Generate up to 3 questions per menu item
    const questionsPerItem = Math.min(3, ingredients.length);
    for (let i = 0; i < questionsPerItem; i++) {
      const question = generateMenuItemContainsIngredientQuestion(
        menuItem,
        ingredients
      );
      if (question) {
        questions.push(question);
      }
    }
  }

  return questions;
}

/**
 * Generate all possible ingredient allergy questions efficiently
 */
function generateIngredientAllergyQuestions(
  ingredients: Ingredient[],
  allergies: Record<string, Allergy>
): QuizQuestion[] {
  const questions: QuizQuestion[] = [];

  // Generate multiple questions to increase variety
  const targetQuestionCount = Math.min(15, ingredients.length);
  for (let i = 0; i < targetQuestionCount; i++) {
    const question = generateIngredientContainsAllergyQuestion(
      ingredients,
      allergies
    );
    if (question) {
      questions.push(question);
    }
  }

  return questions;
}

/**
 * Generate all possible menu item allergy questions efficiently
 */
function generateMenuItemAllergyQuestions(
  menuItems: MenuItem[],
  ingredients: Ingredient[],
  allergies: Record<string, Allergy>
): QuizQuestion[] {
  const questions: QuizQuestion[] = [];

  // Generate multiple questions to increase variety
  const targetQuestionCount = Math.min(15, menuItems.length);
  for (let i = 0; i < targetQuestionCount; i++) {
    const question = generateMenuItemContainsAllergyQuestion(
      menuItems,
      ingredients,
      allergies
    );
    if (question) {
      questions.push(question);
    }
  }

  return questions;
}

/**
 * Generate all possible "which menu item is this" questions efficiently
 */
function generateWhichMenuItemQuestions(
  menuItems: MenuItem[],
  difficulty: Difficulty
): QuizQuestion[] {
  const questions: QuizQuestion[] = [];

  // Filter menu items that have images
  const menuItemsWithImages = menuItems.filter(
    (item) => item.menuItemUrl && item.menuItemUrl.trim() !== ""
  );

  // Generate multiple questions to increase variety
  const targetQuestionCount = Math.min(10, menuItemsWithImages.length);
  for (let i = 0; i < targetQuestionCount; i++) {
    const question = generateWhichMenuItemIsThisQuestion(menuItems, difficulty);
    if (question) {
      questions.push(question);
    }
  }

  return questions;
}

/**
 * Extend questions by duplicating existing ones with unique IDs
 */
function extendQuestionsWithDuplicates(
  allQuestions: QuizQuestion[],
  targetCount: number
): QuizQuestion[] {
  const result: QuizQuestion[] = [];
  let questionIndex = 0;

  for (let i = 0; i < targetCount; i++) {
    if (questionIndex >= allQuestions.length) {
      questionIndex = 0; // Reset to beginning
    }

    const originalQuestion = allQuestions[questionIndex];
    const duplicatedQuestion: QuizQuestion = {
      ...originalQuestion,
      id: `${originalQuestion.id}_dup_${i}`,
    };

    result.push(duplicatedQuestion);
    questionIndex++;
  }

  return shuffleArray(result);
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
