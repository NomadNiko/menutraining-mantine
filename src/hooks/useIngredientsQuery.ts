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
  allergyExcludeMode = true, // Default to exclude mode
  categoryIds,
  categoryExcludeMode = true, // Default to exclude mode
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
        limit: 100, // Assuming reasonable number of allergies
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

  // Query for ingredients with filters
  const ingredientsQuery = useQuery({
    queryKey: [
      "ingredients",
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
        limit: 1000, // Request a large number to get all ingredients at once
      };

      // Add filters to query
      if (searchQuery) {
        queryParams.name = searchQuery;
      }

      // We need client-side filtering for:
      // 1. Exclusion filtering (allergyExcludeMode = true)
      // 2. Multiple allergy IDs
      // 3. Category filtering
      // 4. Sub-ingredients filtering
      const useClientSideFiltering =
        (allergyExcludeMode && allergyIds && allergyIds.length > 0) ||
        (!allergyExcludeMode && allergyIds && allergyIds.length > 0) ||
        (categoryIds && categoryIds.length > 0);

      // If we're not doing client-side filtering, we can use the API's filtering
      if (!useClientSideFiltering && allergyIds && allergyIds.length > 0) {
        queryParams.allergyId = allergyIds[0]; // Currently API supports filtering by one allergyId
      }

      // Add category filter if present and not doing client-side filtering
      if (!useClientSideFiltering && categoryIds && categoryIds.length === 1) {
        queryParams.category = categoryIds[0];
      }

      // Sort is currently not supported by the API, but we prepare the params for future implementation
      if (sortField && sortDirection) {
        queryParams.sort = `${sortField}:${sortDirection}`;
      }

      const { status, data } = await getIngredientsService(
        undefined,
        queryParams
      );

      if (status === HTTP_CODES_ENUM.OK) {
        const ingredientsData = Array.isArray(data) ? data : data?.data || [];

        // Filter ingredients based on exclusion/inclusion of allergies and categories
        let filteredIngredients = [...ingredientsData];

        // Filter by allergies if needed
        if (allergyIds && allergyIds.length > 0) {
          filteredIngredients = filteredIngredients.filter((ingredient) => {
            // Get all allergies for this ingredient (both direct and derived)
            const allAllergies = [
              ...(ingredient.ingredientAllergies || []),
              ...(ingredient.derivedAllergies || []),
            ];

            if (allergyExcludeMode) {
              // In exclude mode, we want ingredients that do NOT have ANY of the selected allergies
              return !allergyIds.some((allergyId) =>
                allAllergies.includes(allergyId)
              );
            } else {
              // In include mode, we want ingredients that HAVE ANY of the selected allergies
              return allergyIds.some((allergyId) =>
                allAllergies.includes(allergyId)
              );
            }
          });
        }

        // Filter by categories if needed
        if (categoryIds && categoryIds.length > 0) {
          filteredIngredients = filteredIngredients.filter((ingredient) => {
            // Ensure ingredient.categories is an array
            const categories = ingredient.categories || [];

            if (categoryExcludeMode) {
              // In exclude mode, we want ingredients that do NOT have ANY of the selected categories
              return !categoryIds.some((categoryId) =>
                categories.includes(categoryId)
              );
            } else {
              // In include mode, we want ingredients that HAVE ANY of the selected categories
              return categoryIds.some((categoryId) =>
                categories.includes(categoryId)
              );
            }
          });
        }

        // Client-side filtering for hasSubIngredients if needed
        if (hasSubIngredients !== null) {
          filteredIngredients = filteredIngredients.filter((ing) =>
            hasSubIngredients
              ? ing.subIngredients && ing.subIngredients.length > 0
              : !ing.subIngredients || ing.subIngredients.length === 0
          );
        }

        // Build sub-ingredient names map
        const subIngredientNamesMap: Record<string, string> = {};
        ingredientsData.forEach((ingredient: Ingredient) => {
          subIngredientNamesMap[ingredient.ingredientId] =
            ingredient.ingredientName;
        });

        // Return all filtered ingredients
        return {
          ingredients: filteredIngredients,
          subIngredientNames: subIngredientNamesMap,
          totalCount: filteredIngredients.length,
          // We don't need hasNextPage as we loaded all data
        };
      }

      return {
        ingredients: [],
        subIngredientNames: {},
        totalCount: 0,
      };
    },
    enabled: !!restaurantId,
  });

  return {
    ingredients: ingredientsQuery.data?.ingredients || [],
    allergiesMap: allergiesQuery.data || {},
    subIngredientNames: ingredientsQuery.data?.subIngredientNames || {},
    isLoading: ingredientsQuery.isLoading || allergiesQuery.isLoading,
    isError: ingredientsQuery.isError || allergiesQuery.isError,
    error: ingredientsQuery.error || allergiesQuery.error,
    totalCount: ingredientsQuery.data?.totalCount || 0,
    hasMore: false, // We're loading all at once, so there's no "more" to load
    loadMore: () => {}, // Empty function as we're loading all at once
    refetch: ingredientsQuery.refetch,
  };
};
