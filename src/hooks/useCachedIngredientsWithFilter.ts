import { useMemo, useState, useCallback } from "react";
import {
  useCachedIngredients,
  useCachedAllergies,
} from "@/services/restaurant/restaurant-data-cache";

interface QueryParams {
  restaurantId: string;
  searchQuery: string;
  allergyIds: string[];
  allergyExcludeMode: boolean;
  categoryIds: string[];
  categoryExcludeMode: boolean;
  hasSubIngredients: boolean | null;
  sortField: string;
  sortDirection: "asc" | "desc";
}

const ITEMS_PER_PAGE = 20;

export function useCachedIngredientsWithFilter(queryParams: QueryParams) {
  const cachedIngredients = useCachedIngredients();
  const cachedAllergies = useCachedAllergies();
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);

  // Create allergies map for quick lookup
  const allergiesMap = useMemo(() => {
    const map: Record<string, string> = {};
    cachedAllergies.forEach((allergy) => {
      map[allergy.allergyId] = allergy.allergyName;
    });
    return map;
  }, [cachedAllergies]);

  // Filter ingredients based on query params
  const filteredIngredients = useMemo(() => {
    let filtered = [...cachedIngredients];

    // Filter by restaurant ID
    if (queryParams.restaurantId) {
      filtered = filtered.filter(
        (ing) => ing.restaurantId === queryParams.restaurantId
      );
    }

    // Filter by search query
    if (queryParams.searchQuery) {
      const query = queryParams.searchQuery.toLowerCase();
      filtered = filtered.filter((ing) =>
        ing.ingredientName.toLowerCase().includes(query)
      );
    }

    // Filter by allergies
    if (queryParams.allergyIds.length > 0) {
      filtered = filtered.filter((ing) => {
        const hasAnyAllergy = queryParams.allergyIds.some((allergyId) =>
          ing.ingredientAllergies?.includes(allergyId)
        );
        return queryParams.allergyExcludeMode ? !hasAnyAllergy : hasAnyAllergy;
      });
    }

    // Filter by categories
    if (queryParams.categoryIds.length > 0) {
      filtered = filtered.filter((ing) => {
        const hasAnyCategory = queryParams.categoryIds.some((categoryId) =>
          ing.categories?.includes(categoryId)
        );
        return queryParams.categoryExcludeMode
          ? !hasAnyCategory
          : hasAnyCategory;
      });
    }

    // Filter by sub-ingredients
    if (queryParams.hasSubIngredients !== null) {
      filtered = filtered.filter((ing) => {
        const hasSubIngredients =
          ing.subIngredients && ing.subIngredients.length > 0;
        return queryParams.hasSubIngredients
          ? hasSubIngredients
          : !hasSubIngredients;
      });
    }

    return filtered;
  }, [
    cachedIngredients,
    queryParams.restaurantId,
    queryParams.searchQuery,
    queryParams.allergyIds,
    queryParams.allergyExcludeMode,
    queryParams.categoryIds,
    queryParams.categoryExcludeMode,
    queryParams.hasSubIngredients,
  ]);

  // Sort ingredients
  const sortedIngredients = useMemo(() => {
    const sorted = [...filteredIngredients];
    const { sortField, sortDirection } = queryParams;

    sorted.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case "ingredientName":
          aValue = a.ingredientName.toLowerCase();
          bValue = b.ingredientName.toLowerCase();
          break;
        case "allergies":
          aValue = a.ingredientAllergies?.length || 0;
          bValue = b.ingredientAllergies?.length || 0;
          break;
        case "categories":
          aValue = a.categories?.length || 0;
          bValue = b.categories?.length || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [filteredIngredients, queryParams]);

  // Paginate ingredients
  const paginatedIngredients = useMemo(() => {
    return sortedIngredients.slice(0, displayCount);
  }, [sortedIngredients, displayCount]);

  const handleSort = useCallback(() => {
    // This will be handled by the parent component updating the query params
  }, []);

  const loadMore = useCallback(() => {
    setDisplayCount((prev) => prev + ITEMS_PER_PAGE);
  }, []);

  const hasMore = displayCount < sortedIngredients.length;

  return {
    ingredients: paginatedIngredients,
    allergiesMap,
    isLoading: false, // Data is already loaded in cache
    isError: false,
    totalCount: sortedIngredients.length,
    refetch: () => {}, // Cache is managed by the provider
    sortField: queryParams.sortField,
    sortDirection: queryParams.sortDirection,
    handleSort,
    hasMore,
    loadMore,
  };
}
