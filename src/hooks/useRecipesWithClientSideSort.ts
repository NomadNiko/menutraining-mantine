// src/hooks/useRecipesWithClientSideSort.ts
"use client";
import { useState, useMemo, useCallback, useEffect } from "react";
import { useRecipesQuery, RecipesQueryParams } from "./useRecipesQuery";

type SortDirection = "asc" | "desc";

export interface SortParams {
  field: string;
  direction: SortDirection;
}

export function useRecipesWithClientSideSort(queryParams: RecipesQueryParams) {
  // State for client-side display pagination
  const [displayCount, setDisplayCount] = useState(10);

  // Local sorting state - initialized from query params
  const [sortParams, setSortParams] = useState<SortParams>({
    field: queryParams.sortField || "recipeName",
    direction: queryParams.sortDirection || "asc",
  });

  // Get the raw data from the server with optimized query params
  const optimizedQueryParams = {
    ...queryParams,
    sortField: undefined, // We'll handle sorting client-side
    sortDirection: undefined,
  };

  const {
    recipes: rawRecipes,
    ingredientsMap,
    equipmentMap,
    isLoading,
    isError,
    totalCount,
    refetch,
  } = useRecipesQuery(optimizedQueryParams);

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

  // Apply client-side sorting to recipes
  const sortedRecipes = useMemo(() => {
    if (!rawRecipes.length) return rawRecipes;

    return [...rawRecipes].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      // Extract values based on sort field
      switch (sortParams.field) {
        case "recipeName":
          aValue = a.recipeName;
          bValue = b.recipeName;
          break;
        case "recipeServings":
          aValue = a.recipeServings;
          bValue = b.recipeServings;
          break;
        case "recipePrepTime":
          aValue = a.recipePrepTime;
          bValue = b.recipePrepTime;
          break;
        case "recipeTotalTime":
          aValue = a.recipeTotalTime;
          bValue = b.recipeTotalTime;
          break;
        case "steps":
          aValue = a.recipeSteps?.length || 0;
          bValue = b.recipeSteps?.length || 0;
          break;
        default:
          // Default to name if unknown field
          aValue = a.recipeName;
          bValue = b.recipeName;
      }

      // Handle string comparison for text fields
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortParams.direction === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      // Handle numeric comparison
      const numA = Number(aValue);
      const numB = Number(bValue);
      return sortParams.direction === "asc" ? numA - numB : numB - numA;
    });
  }, [rawRecipes, sortParams]);

  // Get displayed recipes limited by displayCount
  const displayedRecipes = useMemo(() => {
    return sortedRecipes.slice(0, displayCount);
  }, [sortedRecipes, displayCount]);

  // Check if there are more recipes to show
  const hasMore = useMemo(() => {
    return displayCount < sortedRecipes.length;
  }, [displayCount, sortedRecipes.length]);

  // Function to load more recipes (increase display count)
  const loadMore = useCallback(() => {
    setDisplayCount((prev) => prev + 10);
  }, []);

  // Reset display count when query parameters change (except sort)
  useEffect(() => {
    setDisplayCount(10);
  }, [
    queryParams.restaurantId,
    queryParams.searchQuery,
    queryParams.ingredientIds,
    queryParams.equipmentIds,
    queryParams.maxPrepTime,
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
    recipes: displayedRecipes,
    ingredientsMap,
    equipmentMap,
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
