"use client";
import { useQuery } from "@tanstack/react-query";
import { useGetRecipesService } from "@/services/api/services/recipes";
import { useGetIngredientsService } from "@/services/api/services/ingredients";
import { useGetEquipmentService } from "@/services/api/services/equipment";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import {
  Recipe,
  RecipeStepItem,
  StepIngredientItem,
} from "@/services/api/types/recipe";
import { Ingredient } from "@/services/api/types/ingredient";
import { Equipment } from "@/services/api/types/equipment";

export interface RecipesQueryParams {
  restaurantId: string;
  searchQuery?: string;
  ingredientIds?: string[];
  equipmentIds?: string[];
  maxPrepTime?: number;
  sortField?: string;
  sortDirection?: "asc" | "desc";
}

interface ApiQueryParams {
  restaurantId: string;
  limit: number;
  name?: string;
  ingredientId?: string;
  equipmentId?: string;
  maxPrepTime?: number;
}

export interface RecipesQueryResult {
  recipes: Recipe[];
  ingredientsMap: Record<string, Ingredient>;
  equipmentMap: Record<string, Equipment>;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  totalCount: number;
  hasMore: boolean;
  loadMore: () => void;
  refetch: () => void;
}

export const useRecipesQuery = ({
  restaurantId,
  searchQuery,
  ingredientIds,
  equipmentIds,
  maxPrepTime,
  sortField = "recipeName",
  sortDirection = "asc",
}: RecipesQueryParams): RecipesQueryResult => {
  const getRecipesService = useGetRecipesService();
  const getIngredientsService = useGetIngredientsService();
  const getEquipmentService = useGetEquipmentService();

  // Cache for ingredients and equipment to avoid refetching
  const ingredientsQuery = useQuery({
    queryKey: ["ingredients-for-recipes", restaurantId],
    queryFn: async () => {
      if (!restaurantId) return {};
      const { status, data } = await getIngredientsService(undefined, {
        restaurantId,
        limit: 1000,
        page: 1, // Added required parameter
      });
      if (status === HTTP_CODES_ENUM.OK) {
        const ingredientsArray = Array.isArray(data) ? data : data?.data || [];
        const ingredientsMap: Record<string, Ingredient> = {};
        ingredientsArray.forEach((ingredient: Ingredient) => {
          ingredientsMap[ingredient.ingredientId] = ingredient;
        });
        return ingredientsMap;
      }
      return {};
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    enabled: !!restaurantId,
  });

  // Cache for equipment
  const equipmentQuery = useQuery({
    queryKey: ["equipment-for-recipes"],
    queryFn: async () => {
      const { status, data } = await getEquipmentService(undefined, {
        page: 1, // Added required parameter
        limit: 1000,
      });
      if (status === HTTP_CODES_ENUM.OK) {
        const equipmentArray = Array.isArray(data) ? data : data?.data || [];
        const equipmentMap: Record<string, Equipment> = {};
        equipmentArray.forEach((item: Equipment) => {
          equipmentMap[item.equipmentId] = item;
        });
        return equipmentMap;
      }
      return {};
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  // Main query for recipes with filters
  const recipesQuery = useQuery({
    queryKey: [
      "recipes",
      restaurantId,
      searchQuery,
      ingredientIds,
      equipmentIds,
      maxPrepTime,
      sortField,
      sortDirection,
    ],
    queryFn: async () => {
      if (!restaurantId) return { recipes: [], totalCount: 0 };
      const queryParams: ApiQueryParams = {
        restaurantId,
        limit: 1000,
      };
      if (searchQuery) {
        queryParams.name = searchQuery;
      }
      if (maxPrepTime) {
        queryParams.maxPrepTime = maxPrepTime;
      }

      // Handle advanced filtering
      const useServerFiltering = !ingredientIds || ingredientIds.length <= 1;
      const useEquipmentFiltering = !equipmentIds || equipmentIds.length <= 1;

      if (useServerFiltering && ingredientIds && ingredientIds.length === 1) {
        queryParams.ingredientId = ingredientIds[0];
      }

      if (useEquipmentFiltering && equipmentIds && equipmentIds.length === 1) {
        queryParams.equipmentId = equipmentIds[0];
      }

      const { status, data } = await getRecipesService(undefined, queryParams);
      if (status === HTTP_CODES_ENUM.OK) {
        const recipesData = Array.isArray(data) ? data : data?.data || [];

        // Client-side filtering for multiple ingredients/equipment
        let filteredRecipes = [...recipesData];
        if (!useServerFiltering && ingredientIds && ingredientIds.length > 0) {
          filteredRecipes = filteredRecipes.filter((recipe) => {
            // Check each step for matching ingredients
            return recipe.recipeSteps.some((step: RecipeStepItem) => {
              if (!step.stepIngredientItems) return false;
              return step.stepIngredientItems.some((item: StepIngredientItem) =>
                ingredientIds.includes(item.ingredientId)
              );
            });
          });
        }

        if (!useEquipmentFiltering && equipmentIds && equipmentIds.length > 0) {
          filteredRecipes = filteredRecipes.filter((recipe) => {
            // Check each step for matching equipment
            return recipe.recipeSteps.some((step: RecipeStepItem) => {
              if (!step.stepEquipment) return false;
              return step.stepEquipment.some((equipId: string) =>
                equipmentIds.includes(equipId)
              );
            });
          });
        }

        return {
          recipes: filteredRecipes,
          totalCount: filteredRecipes.length,
        };
      }
      return { recipes: [], totalCount: 0 };
    },
    enabled: !!restaurantId,
  });

  return {
    recipes: recipesQuery.data?.recipes || [],
    ingredientsMap: ingredientsQuery.data || {},
    equipmentMap: equipmentQuery.data || {},
    isLoading:
      recipesQuery.isLoading ||
      ingredientsQuery.isLoading ||
      equipmentQuery.isLoading,
    isError:
      recipesQuery.isError ||
      ingredientsQuery.isError ||
      equipmentQuery.isError,
    error: recipesQuery.error || ingredientsQuery.error || equipmentQuery.error,
    totalCount: recipesQuery.data?.totalCount || 0,
    hasMore: false, // Since we're fetching all at once with client-side filtering
    loadMore: () => {}, // No-op since we're not implementing pagination in this hook
    refetch: recipesQuery.refetch,
  };
};
