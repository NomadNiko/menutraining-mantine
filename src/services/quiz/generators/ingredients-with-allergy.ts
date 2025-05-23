// src/services/quiz/generators/ingredients-with-allergy.ts
import { QuizQuestion, QuestionType } from "../types";
import { Allergy } from "@/services/api/types/allergy";
import { Ingredient } from "@/services/api/types/ingredient";
import { getRandomSubset, combineAndShuffleOptions } from "./utils";

/**
 * Gets all allergies for an ingredient, including allergies from sub-ingredients
 * @param ingredient The ingredient to check
 * @param allIngredients Array of all available ingredients
 * @param visited Set to prevent infinite recursion
 * @returns Set of all allergy IDs
 */
function getIngredientAllAllergies(
  ingredient: Ingredient,
  allIngredients: Ingredient[],
  visited: Set<string> = new Set()
): Set<string> {
  const allAllergies = new Set<string>();

  // Prevent infinite recursion
  if (visited.has(ingredient.ingredientId)) {
    return allAllergies;
  }
  visited.add(ingredient.ingredientId);

  // Add direct allergies
  if (ingredient.ingredientAllergies) {
    ingredient.ingredientAllergies.forEach((allergyId) =>
      allAllergies.add(allergyId)
    );
  }

  // Add derived allergies (if they exist in the data model)
  if (ingredient.derivedAllergies) {
    ingredient.derivedAllergies.forEach((allergyId) =>
      allAllergies.add(allergyId)
    );
  }

  // Add allergies from sub-ingredients
  if (ingredient.subIngredients && ingredient.subIngredients.length > 0) {
    const ingredientMap = new Map<string, Ingredient>();
    allIngredients.forEach((ing) => {
      ingredientMap.set(ing.ingredientId, ing);
    });

    ingredient.subIngredients.forEach((subIngredientId) => {
      const subIngredient = ingredientMap.get(subIngredientId);
      if (subIngredient) {
        const subAllergies = getIngredientAllAllergies(
          subIngredient,
          allIngredients,
          visited
        );
        subAllergies.forEach((allergyId) => allAllergies.add(allergyId));
      }
    });
  }

  return allAllergies;
}

/**
 * Generates a question about ingredients that contain a specific allergy
 * Now considers allergies from sub-ingredients recursively
 */
export function generateIngredientsWithAllergyQuestion(
  allergy: Allergy,
  allIngredients: Ingredient[]
): QuizQuestion | null {
  try {
    // Early validation
    if (!allIngredients.length || !allergy.allergyId) {
      return null;
    }

    // Separate ingredients with and without the allergy in one pass
    // Now considering sub-ingredient allergies
    const ingredientsWithAllergy: Ingredient[] = [];
    const ingredientsWithoutAllergy: Ingredient[] = [];

    for (const ingredient of allIngredients) {
      const allAllergies = getIngredientAllAllergies(
        ingredient,
        allIngredients
      );

      if (allAllergies.has(allergy.allergyId)) {
        ingredientsWithAllergy.push(ingredient);
      } else {
        ingredientsWithoutAllergy.push(ingredient);
      }
    }

    // Early validation - need at least 1 ingredient with allergy and 3 without
    if (
      ingredientsWithAllergy.length < 1 ||
      ingredientsWithoutAllergy.length < 3
    ) {
      return null;
    }

    // Get 1-3 correct ingredients efficiently
    const correctCount = Math.min(
      ingredientsWithAllergy.length,
      Math.floor(Math.random() * 3) + 1 // 1-3 correct answers
    );
    const selectedCorrect = getRandomSubset(
      ingredientsWithAllergy,
      correctCount
    ).map((ing) => ({
      id: ing.ingredientId,
      text: ing.ingredientName,
    }));

    // Get 3-5 incorrect options
    const targetIncorrectCount = 6 - correctCount; // Aim for 6 total options
    const incorrectCount = Math.min(
      ingredientsWithoutAllergy.length,
      Math.max(3, targetIncorrectCount) // At least 3 incorrect options
    );
    const selectedIncorrect = getRandomSubset(
      ingredientsWithoutAllergy,
      incorrectCount
    ).map((ing) => ({
      id: ing.ingredientId,
      text: ing.ingredientName,
    }));

    // Combine and shuffle options
    const allOptions = combineAndShuffleOptions(
      selectedCorrect,
      selectedIncorrect
    );

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
