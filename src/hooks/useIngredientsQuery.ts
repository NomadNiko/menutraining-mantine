// src/hooks/useIngredientsQuery.ts
"use client";
import { useQuery } from "@tanstack/react-query";
import { useGetIngredientsService } from "@/services/api/services/ingredients";
import { useGetAllergiesService } from "@/services/api/services/allergies";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { Ingredient } from "@/services/api/types/ingredient";
import { Allergy } from "@/services/api/types/allergy";

export interface IngredientsQueryParams {
  restaurantId: string;
  searchQuery?: string;
  allergyIds?: string[];
  allergyExcludeMode?: boolean;
  categoryIds?: string[];
  categoryExcludeMode?: boolean;
  hasSubIngredients?: boolean | null;
  sortField?: string;
  sortDirection?: "asc" | "desc";
}

// Define an interface for API query parameters
interface ApiQueryParams {
  restaurantId: string;
  limit: number;
  name?: string;
  allergyId?: string;
  category?: string;
  sort?: string;
}

export interface IngredientsQueryResult {
  ingredients: Ingredient[];
  allergiesMap: Record<string, string>;
  subIngredientNames: Record<string, string>;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  totalCount: number;
  hasMore: boolean;
  loadMore: () => void;
  refetch: () => void;
}

export const useIngredientsQuery = ({
  restaurantId,
  searchQuery,
  allergyIds,
  allergyExcludeMode = true,
  categoryIds,
  categoryExcludeMode = true,
  hasSubIngredients,
  sortField = "ingredientName",
  sortDirection = "asc",
}: IngredientsQueryParams): IngredientsQueryResult => {
  const getIngredientsService = useGetIngredientsService();
  const getAllergiesService = useGetAllergiesService();

  // Query for allergies to build allergyMap
  const allergiesQuery = useQuery({
    queryKey: ["allergies"],
    queryFn: async () => {
      const { status, data } = await getAllergiesService(undefined, {
        page: 1,
        limit: 100,
      });
      if (status === HTTP_CODES_ENUM.OK) {
        const allergiesArray = Array.isArray(data) ? data : data?.data || [];
        const allergyMap: Record<string, string> = {};
        allergiesArray.forEach((allergy: Allergy) => {
          allergyMap[allergy.allergyId] = allergy.allergyName;
        });
        return allergyMap;
      }
      return {};
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  // Separate query to get ALL ingredients for the restaurant
  // to ensure we have complete sub-ingredient names
  const allIngredientsQuery = useQuery({
    queryKey: ["all-ingredients", restaurantId],
    queryFn: async () => {
      const { status, data } = await getIngredientsService(undefined, {
        restaurantId,
        limit: 1000, // Get all ingredients for this restaurant
      });

      if (status === HTTP_CODES_ENUM.OK) {
        const allIngredients = Array.isArray(data) ? data : data?.data || [];
        const nameMap: Record<string, string> = {};

        allIngredients.forEach((ingredient: Ingredient) => {
          nameMap[ingredient.ingredientId] = ingredient.ingredientName;
        });

        return nameMap;
      }

      return {};
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    enabled: !!restaurantId,
  });

  // Main query for ingredients with filters
  const ingredientsQuery = useQuery({
    queryKey: [
      "filtered-ingredients",
      restaurantId,
      searchQuery,
      allergyIds,
      allergyExcludeMode,
      categoryIds,
      categoryExcludeMode,
      hasSubIngredients,
      sortField,
      sortDirection,
    ],
    queryFn: async () => {
      const queryParams: ApiQueryParams = {
        restaurantId,
        limit: 1000,
      };

      if (searchQuery) {
        queryParams.name = searchQuery;
      }

      const useClientSideFiltering =
        (allergyExcludeMode && allergyIds && allergyIds.length > 0) ||
        (!allergyExcludeMode && allergyIds && allergyIds.length > 0) ||
        (categoryIds && categoryIds.length > 0);

      if (!useClientSideFiltering && allergyIds && allergyIds.length > 0) {
        queryParams.allergyId = allergyIds[0];
      }

      if (!useClientSideFiltering && categoryIds && categoryIds.length === 1) {
        queryParams.category = categoryIds[0];
      }

      if (sortField && sortDirection) {
        queryParams.sort = `${sortField}:${sortDirection}`;
      }

      const { status, data } = await getIngredientsService(
        undefined,
        queryParams
      );

      if (status === HTTP_CODES_ENUM.OK) {
        const ingredientsData = Array.isArray(data) ? data : data?.data || [];

        let filteredIngredients = [...ingredientsData];

        if (allergyIds && allergyIds.length > 0) {
          filteredIngredients = filteredIngredients.filter((ingredient) => {
            const allAllergies = [
              ...(ingredient.ingredientAllergies || []),
              ...(ingredient.derivedAllergies || []),
            ];
            if (allergyExcludeMode) {
              return !allergyIds.some((allergyId) =>
                allAllergies.includes(allergyId)
              );
            } else {
              return allergyIds.some((allergyId) =>
                allAllergies.includes(allergyId)
              );
            }
          });
        }

        if (categoryIds && categoryIds.length > 0) {
          filteredIngredients = filteredIngredients.filter((ingredient) => {
            const categories = ingredient.categories || [];
            if (categoryExcludeMode) {
              return !categoryIds.some((categoryId) =>
                categories.includes(categoryId)
              );
            } else {
              return categoryIds.some((categoryId) =>
                categories.includes(categoryId)
              );
            }
          });
        }

        if (hasSubIngredients !== null) {
          filteredIngredients = filteredIngredients.filter((ing) =>
            hasSubIngredients
              ? ing.subIngredients && ing.subIngredients.length > 0
              : !ing.subIngredients || ing.subIngredients.length === 0
          );
        }

        return {
          ingredients: filteredIngredients,
          totalCount: filteredIngredients.length,
        };
      }
      return {
        ingredients: [],
        totalCount: 0,
      };
    },
    enabled: !!restaurantId,
  });

  return {
    ingredients: ingredientsQuery.data?.ingredients || [],
    allergiesMap: allergiesQuery.data || {},
    // Use the COMPLETE ingredient names map from the separate query
    subIngredientNames: allIngredientsQuery.data || {},
    isLoading:
      ingredientsQuery.isLoading ||
      allergiesQuery.isLoading ||
      allIngredientsQuery.isLoading,
    isError:
      ingredientsQuery.isError ||
      allergiesQuery.isError ||
      allIngredientsQuery.isError,
    error:
      ingredientsQuery.error ||
      allergiesQuery.error ||
      allIngredientsQuery.error,
    totalCount: ingredientsQuery.data?.totalCount || 0,
    hasMore: false,
    loadMore: () => {},
    refetch: ingredientsQuery.refetch,
  };
};
