// src/hooks/useMenuItemsQuery.ts
"use client";
import { useQuery } from "@tanstack/react-query";
import { useGetMenuItemsService } from "@/services/api/services/menu-items";
import { useGetAllergiesService } from "@/services/api/services/allergies";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { MenuItem } from "@/services/api/types/menu-item";
import { Allergy } from "@/services/api/types/allergy";

export interface MenuItemsQueryParams {
  restaurantId: string;
  searchQuery?: string;
  ingredientIds?: string[];
  allergyIds?: string[];
  allergyExcludeMode?: boolean;
  sortField?: string;
  sortDirection?: "asc" | "desc";
}

interface ApiQueryParams {
  restaurantId: string;
  limit: number;
  ingredientId?: string;
  sort?: string;
}

export interface MenuItemsQueryResult {
  menuItems: MenuItem[];
  allergiesMap: Record<string, string>;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  totalCount: number;
  hasMore: boolean;
  loadMore: () => void;
  refetch: () => void;
}

export const useMenuItemsQuery = ({
  restaurantId,
  searchQuery,
  ingredientIds,
  allergyIds,
  allergyExcludeMode = true,
  sortField = "menuItemName",
  sortDirection = "asc",
}: MenuItemsQueryParams): MenuItemsQueryResult => {
  const getMenuItemsService = useGetMenuItemsService();
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

  // Main query for menu items with filters
  const menuItemsQuery = useQuery({
    queryKey: [
      "filtered-menu-items",
      restaurantId,
      searchQuery,
      ingredientIds,
      allergyIds,
      allergyExcludeMode,
      sortField,
      sortDirection,
    ],
    queryFn: async () => {
      const queryParams: ApiQueryParams = {
        restaurantId,
        limit: 1000,
      };

      // We can only use one ingredientId in the API query
      if (ingredientIds && ingredientIds.length > 0) {
        queryParams.ingredientId = ingredientIds[0];
      }

      if (sortField && sortDirection) {
        queryParams.sort = `${sortField}:${sortDirection}`;
      }

      const { status, data } = await getMenuItemsService(
        undefined,
        queryParams
      );

      if (status === HTTP_CODES_ENUM.OK) {
        const menuItemsData = Array.isArray(data) ? data : data?.data || [];
        let filteredMenuItems = [...menuItemsData];

        // Client-side filtering for search
        if (searchQuery) {
          const lowerCaseQuery = searchQuery.toLowerCase();
          filteredMenuItems = filteredMenuItems.filter(
            (item) =>
              item.menuItemName.toLowerCase().includes(lowerCaseQuery) ||
              (item.menuItemDescription &&
                item.menuItemDescription.toLowerCase().includes(lowerCaseQuery))
          );
        }

        // Client-side filtering for multiple ingredients
        if (ingredientIds && ingredientIds.length > 1) {
          filteredMenuItems = filteredMenuItems.filter((item) =>
            ingredientIds.some((id) => item.menuItemIngredients.includes(id))
          );
        }
        if (allergyIds && allergyIds.length > 0) {
          filteredMenuItems = filteredMenuItems.filter((item) => {
            const itemAllergies =
              item.allergies?.map((a: { id: string }) => a.id) || [];

            if (allergyExcludeMode) {
              // Exclude items with any of the selected allergies
              return !allergyIds.some((id) => itemAllergies.includes(id));
            } else {
              // Include only items with any of the selected allergies
              return allergyIds.some((id) => itemAllergies.includes(id));
            }
          });
        }
        return {
          menuItems: filteredMenuItems,
          totalCount: filteredMenuItems.length,
        };
      }

      return {
        menuItems: [],
        totalCount: 0,
      };
    },
    enabled: !!restaurantId,
  });

  return {
    menuItems: menuItemsQuery.data?.menuItems || [],
    allergiesMap: allergiesQuery.data || {},
    isLoading: menuItemsQuery.isLoading || allergiesQuery.isLoading,
    isError: menuItemsQuery.isError || allergiesQuery.isError,
    error: menuItemsQuery.error || allergiesQuery.error,
    totalCount: menuItemsQuery.data?.totalCount || 0,
    hasMore: false,
    loadMore: () => {},
    refetch: menuItemsQuery.refetch,
  };
};
