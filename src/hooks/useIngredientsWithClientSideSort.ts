// src/hooks/useIngredientsWithClientSideSort.ts
"use client";
import { useState, useMemo, useCallback, useEffect } from "react";
import {
  useIngredientsQuery,
  IngredientsQueryParams,
} from "./useIngredientsQuery";

type SortDirection = "asc" | "desc";

export interface SortParams {
  field: string;
  direction: SortDirection;
}

export function useIngredientsWithClientSideSort(
  queryParams: IngredientsQueryParams
) {
  // State for client-side display pagination
  const [displayCount, setDisplayCount] = useState(10);

  // Local sorting state - This needs to be initialized from query params
  // but then managed independently to allow immediate UI updates
  const [sortParams, setSortParams] = useState<SortParams>({
    field: queryParams.sortField || "ingredientName",
    direction: queryParams.sortDirection || "asc",
  });

  // We're now always using client-side sorting for responsive UI
  // This ensures clicking sort headers has immediate effect
  const optimizedQueryParams = {
    ...queryParams,
    sortField: undefined, // We'll handle sorting client-side
    sortDirection: undefined,
  };

  // Get the raw data from the server
  const {
    ingredients: rawIngredients,
    allergiesMap,
    isLoading,
    isError,
    totalCount,
    refetch,
  } = useIngredientsQuery(optimizedQueryParams);

  // Handle sorting changes
  const handleSort = useCallback((field: string) => {
    setSortParams((prevSort) => {
      if (prevSort.field === field) {
        // Toggle direction if same field
        return {
          field,
          direction: prevSort.direction === "asc" ? "desc" : "asc",
        };
      }
      // New field, default to ascending
      return {
        field,
        direction: "asc",
      };
    });
    // Reset display count when sorting changes
    setDisplayCount(10);
  }, []);

  // Apply client-side sorting to ingredients
  const sortedIngredients = useMemo(() => {
    if (!rawIngredients.length) return rawIngredients;

    return [...rawIngredients].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      // Extract values based on sort field
      switch (sortParams.field) {
        case "ingredientName":
          aValue = a.ingredientName;
          bValue = b.ingredientName;
          break;
        case "categories":
          // Sort based on first category or empty string
          aValue =
            a.categories && a.categories.length > 0 ? a.categories[0] : "";
          bValue =
            b.categories && b.categories.length > 0 ? b.categories[0] : "";
          break;
        case "allergies":
          // Sort based on allergy count - convert to numbers
          aValue =
            (a.ingredientAllergies?.length || 0) +
            (a.derivedAllergies?.length || 0);
          bValue =
            (b.ingredientAllergies?.length || 0) +
            (b.derivedAllergies?.length || 0);
          break;
        case "subIngredients":
          // Sort based on sub-ingredient count - convert to numbers
          aValue = a.subIngredientDetails?.length || 0;
          bValue = b.subIngredientDetails?.length || 0;
          break;
        default:
          // Default to name if unknown field
          aValue = a.ingredientName;
          bValue = b.ingredientName;
      }

      // Handle string comparison for text fields
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortParams.direction === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      // Handle numeric comparison, ensuring we're working with numbers
      const numA = Number(aValue);
      const numB = Number(bValue);
      return sortParams.direction === "asc" ? numA - numB : numB - numA;
    });
  }, [rawIngredients, sortParams]);

  // Get displayed ingredients limited by displayCount
  const displayedIngredients = useMemo(() => {
    return sortedIngredients.slice(0, displayCount);
  }, [sortedIngredients, displayCount]);

  // Check if there are more ingredients to show
  const hasMore = useMemo(() => {
    return displayCount < sortedIngredients.length;
  }, [displayCount, sortedIngredients.length]);

  // Function to load more ingredients (increase display count)
  const loadMore = useCallback(() => {
    setDisplayCount((prev) => prev + 10);
  }, []);

  // Reset display count when query parameters change (except sort)
  useEffect(() => {
    setDisplayCount(10);
  }, [
    queryParams.restaurantId,
    queryParams.searchQuery,
    queryParams.allergyIds,
    queryParams.allergyExcludeMode,
    queryParams.categoryIds,
    queryParams.categoryExcludeMode,
    queryParams.hasSubIngredients,
  ]);

  // Update sort params if URL params change
  useEffect(() => {
    if (queryParams.sortField && queryParams.sortDirection) {
      setSortParams({
        field: queryParams.sortField,
        direction: queryParams.sortDirection,
      });
    }
  }, [queryParams.sortField, queryParams.sortDirection]);

  return {
    ingredients: displayedIngredients,
    allergiesMap,
    isLoading,
    isError,
    totalCount,
    refetch,
    sortField: sortParams.field,
    sortDirection: sortParams.direction,
    handleSort,
    hasMore,
    loadMore,
  };
}
