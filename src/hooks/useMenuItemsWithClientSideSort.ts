// src/hooks/useMenuItemsWithClientSideSort.ts
"use client";
import { useState, useMemo, useCallback, useEffect } from "react";
import { useMenuItemsQuery, MenuItemsQueryParams } from "./useMenuItemsQuery";

type SortDirection = "asc" | "desc";

export interface SortParams {
  field: string;
  direction: SortDirection;
}

export function useMenuItemsWithClientSideSort(
  queryParams: MenuItemsQueryParams
) {
  // State for client-side display pagination
  const [displayCount, setDisplayCount] = useState(10);

  // Local sorting state initialized from query params
  const [sortParams, setSortParams] = useState<SortParams>({
    field: queryParams.sortField || "menuItemName",
    direction: queryParams.sortDirection || "asc",
  });

  // We'll handle sorting client-side for responsive UI
  const optimizedQueryParams = {
    ...queryParams,
    sortField: undefined,
    sortDirection: undefined,
  };

  // Get the raw data from the server
  const {
    menuItems: rawMenuItems,
    allergiesMap,
    isLoading,
    isError,
    totalCount,
    refetch,
  } = useMenuItemsQuery(optimizedQueryParams);

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

  // Apply client-side sorting to menu items
  const sortedMenuItems = useMemo(() => {
    if (!rawMenuItems.length) return rawMenuItems;

    return [...rawMenuItems].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      // Extract values based on sort field
      switch (sortParams.field) {
        case "menuItemName":
          aValue = a.menuItemName;
          bValue = b.menuItemName;
          break;
        case "menuItemDescription":
          aValue = a.menuItemDescription || "";
          bValue = b.menuItemDescription || "";
          break;
        case "ingredients":
          // Sort based on ingredient count
          aValue = a.menuItemIngredients?.length || 0;
          bValue = b.menuItemIngredients?.length || 0;
          break;
        case "allergies":
          // Sort based on allergy count
          aValue = a.allergies?.length || 0;
          bValue = b.allergies?.length || 0;
          break;
        default:
          // Default to name if unknown field
          aValue = a.menuItemName;
          bValue = b.menuItemName;
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
  }, [rawMenuItems, sortParams]);

  // Get displayed menu items limited by displayCount
  const displayedMenuItems = useMemo(() => {
    return sortedMenuItems.slice(0, displayCount);
  }, [sortedMenuItems, displayCount]);

  // Check if there are more menu items to show
  const hasMore = useMemo(() => {
    return displayCount < sortedMenuItems.length;
  }, [displayCount, sortedMenuItems.length]);

  // Function to load more menu items (increase display count)
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
    queryParams.allergyIds,
    queryParams.allergyExcludeMode,
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
    menuItems: displayedMenuItems,
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
