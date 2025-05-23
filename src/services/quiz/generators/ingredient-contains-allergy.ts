// src/services/quiz/generators/ingredient-contains-allergy.ts
import { QuizQuestion, QuestionType } from "../types";
import { Ingredient } from "@/services/api/types/ingredient";
import { Allergy } from "@/services/api/types/allergy";
import { getRandomSubset } from "./utils";

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
 * Generates a true/false question about whether an ingredient contains a specific allergy
 */
export function generateIngredientContainsAllergyQuestion(
  allIngredients: Ingredient[],
  allergies: Record<string, Allergy>
): QuizQuestion | null {
  try {
    // Early validation
    if (!allIngredients.length || !Object.keys(allergies).length) {
      return null;
    }

    const allergyList = Object.values(allergies);

    // Select a random allergy
    const selectedAllergy = getRandomSubset(allergyList, 1)[0];

    // Select a random ingredient
    const selectedIngredient = getRandomSubset(allIngredients, 1)[0];

    // Check if the ingredient contains this allergy
    const ingredientAllergies = getIngredientAllAllergies(
      selectedIngredient,
      allIngredients
    );
    const correctAnswer = ingredientAllergies.has(selectedAllergy.allergyId);

    const questionText = `Does "${selectedIngredient.ingredientName}" contain the ${selectedAllergy.allergyName} allergy?`;

    // Create the true/false options
    const options = [
      { id: "true", text: "True" },
      { id: "false", text: "False" },
    ];

    return {
      id: `q_ingredient_allergy_${Date.now()}_${Math.random()}`,
      type: QuestionType.INGREDIENT_CONTAINS_ALLERGY,
      questionText,
      imageUrl: selectedIngredient.ingredientImageUrl || null,
      options,
      correctAnswerIds: [correctAnswer ? "true" : "false"],
      isSingleChoice: true,
    };
  } catch (error) {
    console.error(
      "Error generating ingredient contains allergy question:",
      error
    );
    return null;
  }
}
