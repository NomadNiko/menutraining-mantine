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
import { Allergy } from "@/services/api/types/allergy";

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

      // Decide which type of question to generate with improved probability distribution
      let tryAllergyQuestion;

      if (needMoreAllergyQuestions) {
        // Force allergy questions if we need more to meet minimum
        tryAllergyQuestion = true;
      } else if (needMoreMenuItemQuestions) {
        // Force menu item questions if we need more to meet minimum
        tryAllergyQuestion = false;
      } else {
        // Otherwise use a higher probability for allergy questions (50% instead of 30%)
        // This helps ensure a more balanced mix of question types
        tryAllergyQuestion = Math.random() < 0.5 && allergies.length > 0;
      }

      if (tryAllergyQuestion) {
        // Get allergies we haven't used yet, or all if we've used them all
        const unusedAllergies = allergies.filter(
          (allergy) => !usedAllergyIds.has(allergy.allergyId)
        );
        const allergyPool =
          unusedAllergies.length > 0 ? unusedAllergies : allergies;
        const randomIndex = Math.floor(Math.random() * allergyPool.length);
        const selectedAllergy = allergyPool[randomIndex];

        // Try to generate an allergy question
        const question = generateIngredientsWithAllergyQuestion(
          selectedAllergy,
          restaurantData.ingredients
        );

        if (question) {
          // Mark this allergy as used
          usedAllergyIds.add(selectedAllergy.allergyId);
          // Make the question ID unique
          question.id = `q_allergy_${selectedAllergy.allergyId}_${questions.length}`;
          questions.push(question);
          allergyQuestionCount++; // Track allergy questions count
          continue; // Skip to next iteration
        }
        // If allergy question generation failed, fall back to menu item questions
      }

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
        availableItems.forEach((item) =>
          usedMenuItemIds.delete(item.menuItem.id)
        );
      }

      // Find menu items we haven't used yet
      const unusedItems = availableItems.filter(
        (item) => !usedMenuItemIds.has(item.menuItem.id)
      );

      // If all menu items are used, just take any valid menu item from the chosen pool
      const menuItemPool =
        unusedItems.length > 0 ? unusedItems : availableItems;

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
        question.id = `q_${menuItem.id}_${questions.length}`;
        questions.push(question);
        menuItemQuestionCount++; // Track menu item questions count
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
 * Generates a question about ingredients that contain a specific allergy
 */
function generateIngredientsWithAllergyQuestion(
  allergy: Allergy,
  allIngredients: Ingredient[]
): QuizQuestion | null {
  try {
    // Find ingredients that contain this allergy
    const ingredientsWithAllergy = allIngredients.filter((ing) => {
      const allAllergies = [
        ...(ing.ingredientAllergies || []),
        ...(ing.derivedAllergies || []),
      ];
      return allAllergies.includes(allergy.allergyId);
    });

    // We need at least 2 ingredients with this allergy to make it interesting
    if (ingredientsWithAllergy.length < 2) {
      return null;
    }

    // Get 2-3 correct ingredients (or all if fewer)
    const correctCount = Math.min(
      ingredientsWithAllergy.length,
      Math.floor(Math.random() * 2) + 2 // 2-3 correct answers
    );
    const selectedCorrect = getRandomSubset(
      ingredientsWithAllergy,
      correctCount
    ).map((ing) => ({
      id: ing.ingredientId,
      text: ing.ingredientName,
    }));

    // Find ingredients that do NOT contain this allergy
    const ingredientsWithoutAllergy = allIngredients.filter((ing) => {
      const allAllergies = [
        ...(ing.ingredientAllergies || []),
        ...(ing.derivedAllergies || []),
      ];
      return !allAllergies.includes(allergy.allergyId);
    });

    // Get incorrect options (ingredients without the allergy)
    const incorrectCount = Math.min(
      ingredientsWithoutAllergy.length,
      6 - correctCount // Ensure we have at most 6 total options
    );
    if (incorrectCount < 1) {
      // Not enough incorrect options to make a good question
      return null;
    }
    const selectedIncorrect = getRandomSubset(
      ingredientsWithoutAllergy,
      incorrectCount
    ).map((ing) => ({
      id: ing.ingredientId,
      text: ing.ingredientName,
    }));

    // Combine and shuffle options
    const allOptions = shuffleArray([...selectedCorrect, ...selectedIncorrect]);

    return {
      id: `q_allergy_${allergy.allergyId}`,
      type: QuestionType.INGREDIENTS_WITH_ALLERGY,
      questionText: `Which ingredients contain the ${allergy.allergyName} allergy?`,
      imageUrl: allergy.allergyLogoUrl || null,
      options: allOptions,
      correctAnswerIds: selectedCorrect.map((ing) => ing.id),
    };
  } catch (error) {
    console.error("Error generating allergy question:", error);
    return null;
  }
}

/**
 * Generates a question about ingredients in a dish (for multi-ingredient items)
 */
function generateIngredientsInDishQuestion(
  menuItem: MenuItem,
  correctIngredients: AnswerOption[],
  allIngredients: Ingredient[]
): QuizQuestion | null {
  try {
    // Get 2-3 correct ingredients (or all if fewer) - REDUCED from 3-4
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

    // Get 3-4 incorrect ingredients - REDUCED from 4-5
    const incorrectCount = Math.min(
      incorrectIngredients.length,
      6 - correctCount // Ensure we have at most 6 total options (changed from 8)
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

/**
 * Generates a question for single-ingredient menu items
 * This creates a "Which menu item contains [ingredient]?" question
 */
function generateSingleIngredientQuestion(
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
    const allOptions = shuffleArray([correctOption, ...incorrectOptions]);

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
