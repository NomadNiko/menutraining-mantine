"use client";
import { useQuery } from "@tanstack/react-query";
import { useGetIngredientsService } from "@/services/api/services/ingredients";
import { useGetAllergiesService } from "@/services/api/services/allergies";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { Ingredient } from "@/services/api/types/ingredient";
import { Allergy } from "@/services/api/types/allergy";

export interface IngredientsQueryParams {
  restaurantId: string;
  page: number;
  pageSize: number;
  searchQuery?: string;
  allergyIds?: string[];
  allergyExcludeMode?: boolean;
  hasSubIngredients?: boolean | null;
  sortField?: string;
  sortDirection?: "asc" | "desc";
}

// Define an interface for API query parameters
interface ApiQueryParams {
  restaurantId: string;
  page: number;
  limit: number;
  name?: string;
  allergyId?: string;
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
  totalPages: number;
  refetch: () => void;
}

export const useIngredientsQuery = ({
  restaurantId,
  page,
  pageSize,
  searchQuery,
  allergyIds,
  allergyExcludeMode = true, // Default to exclude mode
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
      page,
      pageSize,
      searchQuery,
      allergyIds,
      allergyExcludeMode,
      hasSubIngredients,
      sortField,
      sortDirection,
    ],
    queryFn: async () => {
      const queryParams: ApiQueryParams = {
        restaurantId,
        page,
        limit: pageSize,
      };

      // Add filters to query
      if (searchQuery) {
        queryParams.name = searchQuery;
      }

      // For include mode (allergyExcludeMode = false), we can use the API's existing filter
      // For exclude mode (allergyExcludeMode = true), we need to get all ingredients and filter client-side
      // NOTE: Since the API doesn't directly support exclusion filtering, we'll get all ingredients
      // and filter on the client side
      const useClientSideFiltering =
        (allergyExcludeMode && allergyIds && allergyIds.length > 0) ||
        (!allergyExcludeMode && allergyIds && allergyIds.length > 0); // Always use client-side filtering for allergies

      if (!useClientSideFiltering && allergyIds && allergyIds.length > 0) {
        queryParams.allergyId = allergyIds[0]; // Currently API supports filtering by one allergyId
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

        // Filter ingredients based on exclusion/inclusion of allergies
        let filteredIngredients = [...ingredientsData];

        if (useClientSideFiltering && allergyIds && allergyIds.length > 0) {
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

        // Calculate total pages based on current page size and response
        const hasNextPage = data.hasNextPage || false;
        const estimatedTotalCount = filteredIngredients.length;
        const estimatedTotalPages = Math.max(
          Math.ceil(estimatedTotalCount / pageSize),
          page // Ensure we have at least the current page
        );

        return {
          ingredients: filteredIngredients.slice(
            (page - 1) * pageSize,
            page * pageSize
          ),
          subIngredientNames: subIngredientNamesMap,
          // Estimated count and pages based on available info
          estimatedTotalCount,
          estimatedTotalPages,
          hasNextPage,
        };
      }

      return {
        ingredients: [],
        subIngredientNames: {},
        estimatedTotalCount: 0,
        estimatedTotalPages: 0,
        hasNextPage: false,
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
    totalCount: ingredientsQuery.data?.estimatedTotalCount || 0,
    totalPages: ingredientsQuery.data?.estimatedTotalPages || 0,
    refetch: ingredientsQuery.refetch,
  };
};
