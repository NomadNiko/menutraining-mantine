// src/services/quiz/question-generator.ts
import {
  QuizQuestion,
  AnswerOption,
  QuestionGeneratorResult,
  RestaurantData,
  QuestionType,
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
  questionCount: number,
  questionTypes: QuestionType[] = Object.values(QuestionType)
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

    // Determine which question types to use
    const useAllergyQuestions = questionTypes.includes(
      QuestionType.INGREDIENTS_WITH_ALLERGY
    );
    const useDishQuestions = questionTypes.includes(
      QuestionType.INGREDIENTS_IN_DISH
    );

    // If no types selected, return empty
    if (!useAllergyQuestions && !useDishQuestions) {
      return {
        questions: [],
        error: "No question types selected",
      };
    }

    // Track question types to ensure a balanced distribution
    let allergyQuestionCount = 0;
    let menuItemQuestionCount = 0;

    // Calculate minimum questions for each type based on selected types
    const totalTypes = questionTypes.length;
    const minQuestionsPerType = Math.floor(questionCount / totalTypes);
    const minAllergyQuestions = useAllergyQuestions ? minQuestionsPerType : 0;
    const minMenuItemQuestions = useDishQuestions ? minQuestionsPerType : 0;

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

    // If we need dish questions but have no valid menu items, we can't create questions
    if (
      useDishQuestions &&
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
        useAllergyQuestions &&
        allergyQuestionCount < minAllergyQuestions &&
        remainingQuestions <= minAllergyQuestions - allergyQuestionCount;
      const needMoreMenuItemQuestions =
        useDishQuestions &&
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
        // If only one type is enabled, use it
        if (useAllergyQuestions && !useDishQuestions) {
          generateAllergyQuestion = true;
        } else if (!useAllergyQuestions && useDishQuestions) {
          generateAllergyQuestion = false;
        } else {
          // Both types enabled, alternate
          generateAllergyQuestion =
            questions.length % 2 === 0 && allergies.length > 0;
        }
      }

      let questionGenerated = false;

      if (generateAllergyQuestion && useAllergyQuestions) {
        const question = await generateAllergyQuestionHelper(
          allergies,
          usedAllergyIds,
          restaurantData,
          questions.length
        );

        if (question) {
          questions.push(question);
          allergyQuestionCount++;
          questionGenerated = true;
        }
      }

      // Only try to generate menu item question if we should and haven't generated a question yet
      if (!questionGenerated && useDishQuestions) {
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
          questionGenerated = true;
        }
      }

      // If we couldn't generate any question, break to avoid infinite loop
      if (!questionGenerated) {
        console.warn("Could not generate more questions, stopping early");
        break;
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

  // If we have no items at all, return null
  if (availableItems.length === 0) {
    return null;
  }

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
