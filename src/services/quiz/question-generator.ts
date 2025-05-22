// src/services/quiz/question-generator.ts
import {
  QuizQuestion,
  AnswerOption,
  QuestionGeneratorResult,
  RestaurantData,
} from "./types";
import { MenuItem } from "@/services/api/types/menu-item";
import { Ingredient } from "@/services/api/types/ingredient";
import { Allergy } from "@/services/api/types/allergy";

// Import question generators
import { generateIngredientsWithAllergyQuestion } from "./generators/ingredients-with-allergy";
import { generateIngredientsInDishQuestion } from "./generators/ingredients-in-dish";
import { generateSingleIngredientQuestion } from "./generators/single-ingredient";

// Import utilities
import { shuffleArray } from "./generators/utils";

/**
 * Generates questions for the quiz, ensuring exactly the requested number of questions
 * by reusing menu items if necessary.
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

    // Track question types to ensure a balanced distribution
    let allergyQuestionCount = 0;
    let menuItemQuestionCount = 0;

    // Define minimum thresholds for balance (aiming for roughly 50-50 split)
    const minAllergyQuestions = Math.floor(questionCount * 0.4); // At least 40% allergy questions
    const minMenuItemQuestions = Math.floor(questionCount * 0.4); // At least 40% menu item questions

    // Get all menu items with their ingredients
    const menuItemsWithIngredients = restaurantData.menuItems.map(
      (menuItem) => {
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
      }
    );

    // Filter menu items by ingredient count
    const multiIngredientItems = menuItemsWithIngredients.filter(
      (item) => item.ingredients.length >= 2
    );
    const singleIngredientItems = menuItemsWithIngredients.filter(
      (item) => item.ingredients.length === 1
    );

    console.log(
      `Found ${multiIngredientItems.length} multi-ingredient items and ${singleIngredientItems.length} single-ingredient items`
    );

    // If we have no valid menu items at all, we can't create questions
    if (
      multiIngredientItems.length === 0 &&
      singleIngredientItems.length === 0
    ) {
      return {
        questions: [],
        error: "No menu items with ingredients to create questions",
      };
    }

    // Extract allergies for our new question type
    const allergies = Object.values(restaurantData.allergies);
    console.log(`Found ${allergies.length} allergies to use for questions`);

    // Keep track of which menu items we've used to avoid immediate repeats
    const usedMenuItemIds = new Set<string>();

    // Keep track of which allergies we've used
    const usedAllergyIds = new Set<string>();

    // Continue generating questions until we reach the desired count
    while (questions.length < questionCount) {
      // Determine if we need to force a specific question type to meet balance requirements
      const remainingQuestions = questionCount - questions.length;
      const needMoreAllergyQuestions =
        allergyQuestionCount < minAllergyQuestions &&
        remainingQuestions <= minAllergyQuestions - allergyQuestionCount;
      const needMoreMenuItemQuestions =
        menuItemQuestionCount < minMenuItemQuestions &&
        remainingQuestions <= minMenuItemQuestions - menuItemQuestionCount;

      // Decide which type of question to generate
      let generateAllergyQuestion = false;

      if (needMoreAllergyQuestions) {
        // Force allergy questions if we need more to meet minimum
        generateAllergyQuestion = true;
      } else if (needMoreMenuItemQuestions) {
        // Force menu item questions if we need more to meet minimum
        generateAllergyQuestion = false;
      } else {
        // Simple alternating pattern to ensure balance
        generateAllergyQuestion =
          questions.length % 2 === 0 && allergies.length > 0;
      }

      if (generateAllergyQuestion) {
        const question = await generateAllergyQuestionHelper(
          allergies,
          usedAllergyIds,
          restaurantData,
          questions.length
        );
        if (question) {
          questions.push(question);
          allergyQuestionCount++;
          continue;
        }
      }

      // Generate menu item question (either as fallback or by choice)
      const question = await generateMenuItemQuestion(
        multiIngredientItems,
        singleIngredientItems,
        usedMenuItemIds,
        restaurantData,
        questions.length
      );

      if (question) {
        questions.push(question);
        menuItemQuestionCount++;
      }
    }

    console.log(`Generated ${questions.length} quiz questions`);
    console.log(
      `Allergy questions: ${allergyQuestionCount}, Menu item questions: ${menuItemQuestionCount}`
    );

    // Final shuffle to randomize question order
    return { questions: shuffleArray(questions) };
  } catch (error) {
    console.error("Error generating quiz questions:", error);
    return {
      questions: [],
      error: "Failed to generate questions",
    };
  }
}

/**
 * Helper function to generate an allergy-related question
 */
async function generateAllergyQuestionHelper(
  allergies: Allergy[],
  usedAllergyIds: Set<string>,
  restaurantData: RestaurantData,
  questionCount: number
): Promise<QuizQuestion | null> {
  // Get allergies we haven't used yet, or all if we've used them all
  const unusedAllergies = allergies.filter(
    (allergy) => !usedAllergyIds.has(allergy.allergyId)
  );
  const allergyPool = unusedAllergies.length > 0 ? unusedAllergies : allergies;

  // Try each allergy until we find one that works
  for (const selectedAllergy of shuffleArray(allergyPool)) {
    // Try to generate an allergy question
    const question = generateIngredientsWithAllergyQuestion(
      selectedAllergy,
      restaurantData.ingredients
    );

    if (question) {
      // Mark this allergy as used
      usedAllergyIds.add(selectedAllergy.allergyId);

      // Make the question ID unique
      question.id = `q_allergy_${selectedAllergy.allergyId}_${questionCount}`;

      return question;
    }
  }

  return null;
}

/**
 * Helper function to generate a menu item-related question
 */
async function generateMenuItemQuestion(
  multiIngredientItems: Array<{
    menuItem: MenuItem;
    ingredients: AnswerOption[];
  }>,
  singleIngredientItems: Array<{
    menuItem: MenuItem;
    ingredients: AnswerOption[];
  }>,
  usedMenuItemIds: Set<string>,
  restaurantData: RestaurantData,
  questionCount: number
): Promise<QuizQuestion | null> {
  // Determine whether to use multi-ingredient items or single-ingredient items
  const useMultiIngredientItem =
    multiIngredientItems.length > 0 &&
    (singleIngredientItems.length === 0 || Math.random() > 0.3); // 70% chance to use multi-ingredient if both are available

  const availableItems = useMultiIngredientItem
    ? multiIngredientItems
    : singleIngredientItems;

  // If all available items of the chosen type are used, reset tracking for that type
  if (usedMenuItemIds.size >= availableItems.length) {
    console.log(
      `Used all ${useMultiIngredientItem ? "multi" : "single"}-ingredient items, resetting for more questions`
    );
    availableItems.forEach((item) => usedMenuItemIds.delete(item.menuItem.id));
  }

  // Find menu items we haven't used yet
  const unusedItems = availableItems.filter(
    (item) => !usedMenuItemIds.has(item.menuItem.id)
  );

  // If all menu items are used, just take any valid menu item from the chosen pool
  const menuItemPool = unusedItems.length > 0 ? unusedItems : availableItems;

  // Get a random menu item
  const randomIndex = Math.floor(Math.random() * menuItemPool.length);
  const { menuItem, ingredients } = menuItemPool[randomIndex];

  // Mark this menu item as used
  usedMenuItemIds.add(menuItem.id);

  // Generate a question based on ingredient count
  let question: QuizQuestion | null = null;

  if (ingredients.length >= 2) {
    // For multi-ingredient menu items
    question = generateIngredientsInDishQuestion(
      menuItem,
      ingredients,
      restaurantData.ingredients
    );
  } else if (ingredients.length === 1) {
    // For single-ingredient menu items
    question = generateSingleIngredientQuestion(
      menuItem,
      ingredients[0],
      restaurantData.ingredients,
      restaurantData.menuItems
    );
  }

  if (question) {
    // Make the question ID unique even when reusing menu items
    question.id = `q_${menuItem.id}_${questionCount}`;
    return question;
  }

  return null;
}

// Re-export generators and utilities for direct access
export * from "./generators/utils";
export { generateIngredientsWithAllergyQuestion } from "./generators/ingredients-with-allergy";
export { generateIngredientsInDishQuestion } from "./generators/ingredients-in-dish";
export { generateSingleIngredientQuestion } from "./generators/single-ingredient";
