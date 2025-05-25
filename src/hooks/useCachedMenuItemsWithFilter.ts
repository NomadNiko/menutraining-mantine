import { useMemo, useState, useCallback } from "react";
import {
  useCachedMenuItems,
  useCachedAllergies,
} from "@/services/restaurant/restaurant-data-cache";

interface QueryParams {
  restaurantId: string;
  searchQuery: string;
  allergyIds: string[];
  allergyExcludeMode: boolean;
  ingredientIds: string[];
  sortField: string;
  sortDirection: "asc" | "desc";
}

const ITEMS_PER_PAGE = 20;

export function useCachedMenuItemsWithFilter(queryParams: QueryParams) {
  const cachedMenuItems = useCachedMenuItems();
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

  // Filter menu items based on query params
  const filteredMenuItems = useMemo(() => {
    let filtered = [...cachedMenuItems];

    // Filter by restaurant ID
    if (queryParams.restaurantId) {
      filtered = filtered.filter(
        (item) => item.restaurantId === queryParams.restaurantId
      );
    }

    // Filter by search query
    if (queryParams.searchQuery) {
      const query = queryParams.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.menuItemName.toLowerCase().includes(query) ||
          item.menuItemDescription?.toLowerCase().includes(query)
      );
    }

    // Filter by allergies
    if (queryParams.allergyIds.length > 0) {
      filtered = filtered.filter((item) => {
        const hasAnyAllergy = queryParams.allergyIds.some((allergyId) =>
          item.allergies?.some((allergy) => allergy.id === allergyId)
        );
        return queryParams.allergyExcludeMode ? !hasAnyAllergy : hasAnyAllergy;
      });
    }

    // Filter by ingredients
    if (queryParams.ingredientIds.length > 0) {
      filtered = filtered.filter((item) => {
        const hasAnyIngredient = queryParams.ingredientIds.some(
          (ingredientId) => item.menuItemIngredients?.includes(ingredientId)
        );
        return hasAnyIngredient;
      });
    }

    return filtered;
  }, [
    cachedMenuItems,
    queryParams.restaurantId,
    queryParams.searchQuery,
    queryParams.allergyIds,
    queryParams.allergyExcludeMode,
    queryParams.ingredientIds,
  ]);

  // Sort menu items
  const sortedMenuItems = useMemo(() => {
    const sorted = [...filteredMenuItems];
    const { sortField, sortDirection } = queryParams;

    sorted.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case "menuItemName":
          aValue = a.menuItemName.toLowerCase();
          bValue = b.menuItemName.toLowerCase();
          break;
        case "menuItemDescription":
          aValue = (a.menuItemDescription || "").toLowerCase();
          bValue = (b.menuItemDescription || "").toLowerCase();
          break;
        case "ingredients":
          aValue = a.menuItemIngredients?.length || 0;
          bValue = b.menuItemIngredients?.length || 0;
          break;
        case "allergies":
          aValue = a.allergies?.length || 0;
          bValue = b.allergies?.length || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [filteredMenuItems, queryParams]);

  // Paginate menu items
  const paginatedMenuItems = useMemo(() => {
    return sortedMenuItems.slice(0, displayCount);
  }, [sortedMenuItems, displayCount]);

  const handleSort = useCallback(() => {
    // This will be handled by the parent component updating the query params
  }, []);

  const loadMore = useCallback(() => {
    setDisplayCount((prev) => prev + ITEMS_PER_PAGE);
  }, []);

  const hasMore = displayCount < sortedMenuItems.length;

  return {
    menuItems: paginatedMenuItems,
    allergiesMap,
    isLoading: false, // Data is already loaded in cache
    isError: false,
    totalCount: sortedMenuItems.length,
    refetch: () => {}, // Cache is managed by the provider
    sortField: queryParams.sortField,
    sortDirection: queryParams.sortDirection,
    handleSort,
    hasMore,
    loadMore,
  };
}
