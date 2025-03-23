// src/hooks/useIngredientsWithClientSideSort.ts
"use client";
import { useState, useMemo, useCallback } from "react";
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
  // We'll handle sorting client-side, so we don't pass sort parameters to the API
  const queryParamsWithoutSort = {
    ...queryParams,
    sortField: undefined,
    sortDirection: undefined,
  };

  // Get the raw data from the server
  const {
    ingredients: rawIngredients,
    allergiesMap,
    subIngredientNames,
    isLoading,
    isError,
    totalCount,
    totalPages,
    refetch,
  } = useIngredientsQuery(queryParamsWithoutSort);

  // Local sorting state
  const [sortParams, setSortParams] = useState<SortParams>({
    field: queryParams.sortField || "ingredientName",
    direction: queryParams.sortDirection || "asc",
  });

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
          aValue = a.subIngredients?.length || 0;
          bValue = b.subIngredients?.length || 0;
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

  return {
    ingredients: sortedIngredients,
    allergiesMap,
    subIngredientNames,
    isLoading,
    isError,
    totalCount,
    totalPages,
    refetch,
    sortField: sortParams.field,
    sortDirection: sortParams.direction,
    handleSort,
  };
}
