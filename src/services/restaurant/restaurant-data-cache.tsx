"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  useRef,
} from "react";
import { MenuItem } from "@/services/api/types/menu-item";
import { Ingredient } from "@/services/api/types/ingredient";
import { Allergy } from "@/services/api/types/allergy";
import { Recipe } from "@/services/api/types/recipe";
import { Equipment } from "@/services/api/types/equipment";
import { MenuSection } from "@/services/api/types/menu-section";
import { Menu } from "@/services/api/types/menu";
import { useGetMenuItemsService } from "@/services/api/services/menu-items";
import { useGetIngredientsService } from "@/services/api/services/ingredients";
import { useGetAllergiesService } from "@/services/api/services/allergies";
import { useGetRecipesService } from "@/services/api/services/recipes";
import { useGetEquipmentService } from "@/services/api/services/equipment";
import { useGetMenuSectionsService } from "@/services/api/services/menu-sections";
import { useGetMenusService } from "@/services/api/services/menus";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import useSelectedRestaurant from "@/services/restaurant/use-selected-restaurant";
import useAuth from "@/services/auth/use-auth";
import { DataPreloadModal } from "@/components/data-preload/DataPreloadModal";

interface RestaurantDataCache {
  restaurantId: string;
  menuItems: MenuItem[];
  ingredients: Ingredient[];
  allergies: Allergy[];
  recipes: Recipe[];
  equipment: Equipment[];
  menuSections: MenuSection[];
  menus: Menu[];
  lastUpdated: number;
  isLoading: boolean;
  error: string | null;
}

interface RestaurantDataCacheContextType {
  data: RestaurantDataCache | null;
  refreshData: () => Promise<void>;
  clearCache: () => void;
}

const RestaurantDataCacheContext = createContext<
  RestaurantDataCacheContextType | undefined
>(undefined);

export function RestaurantDataCacheProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { selectedRestaurant } = useSelectedRestaurant();
  const { user } = useAuth();
  const [data, setData] = useState<RestaurantDataCache | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const lastRestaurantId = useRef<string | null>(null);
  const isLoadingRef = useRef(false);
  const dataRef = useRef<RestaurantDataCache | null>(null);

  // Keep dataRef in sync with data state
  useEffect(() => {
    dataRef.current = data;
  }, [data]);
  // API hooks
  const getMenuItemsService = useGetMenuItemsService();
  const getIngredientsService = useGetIngredientsService();
  const getAllergiesService = useGetAllergiesService();
  const getRecipesService = useGetRecipesService();
  const getEquipmentService = useGetEquipmentService();
  const getMenuSectionsService = useGetMenuSectionsService();
  const getMenusService = useGetMenusService();

  const loadAllData = useCallback(async () => {
    if (!selectedRestaurant || isLoadingRef.current) {
      console.log(
        `[DataCache] Skipping load - restaurant: ${!!selectedRestaurant}, loading: ${isLoadingRef.current}`
      );
      return;
    }

    isLoadingRef.current = true;
    setIsLoadingData(true);
    console.log(
      `[DataCache] Starting comprehensive data preload for restaurant: ${selectedRestaurant.restaurantId}`
    );

    setData((prev) => ({
      restaurantId: selectedRestaurant.restaurantId,
      menuItems: prev?.menuItems || [],
      ingredients: prev?.ingredients || [],
      allergies: prev?.allergies || [],
      recipes: prev?.recipes || [],
      equipment: prev?.equipment || [],
      menuSections: prev?.menuSections || [],
      menus: prev?.menus || [],
      lastUpdated: prev?.lastUpdated || Date.now(),
      isLoading: true,
      error: null,
    }));

    try {
      // Fetch all data in parallel for maximum speed
      const [
        menuItemsRes,
        ingredientsRes,
        allergiesRes,
        recipesRes,
        equipmentRes,
        menuSectionsRes,
        menusRes,
      ] = await Promise.all([
        getMenuItemsService(undefined, {
          restaurantId: selectedRestaurant.restaurantId,
          limit: 1000, // Get all items
        }),
        getIngredientsService(undefined, {
          restaurantId: selectedRestaurant.restaurantId,
          limit: 1000,
        }),
        getAllergiesService(undefined, {
          page: 1,
          limit: 1000,
        }),
        getRecipesService(undefined, {
          restaurantId: selectedRestaurant.restaurantId,
          limit: 1000,
        }),
        getEquipmentService(undefined, {
          page: 1,
          limit: 1000,
        }),
        getMenuSectionsService(undefined, {
          restaurantId: selectedRestaurant.restaurantId,
          limit: 1000,
        }),
        getMenusService(undefined, {
          restaurantId: selectedRestaurant.restaurantId,
          limit: 1000,
        }),
      ]);

      // Process responses
      const processResponse = (response: { status: number; data: unknown }) => {
        if (response.status === HTTP_CODES_ENUM.OK) {
          return Array.isArray(response.data)
            ? response.data
            : (response.data as { data?: unknown[] })?.data || [];
        }
        return [];
      };

      const newData: RestaurantDataCache = {
        restaurantId: selectedRestaurant.restaurantId,
        menuItems: processResponse(menuItemsRes),
        ingredients: processResponse(ingredientsRes),
        allergies: processResponse(allergiesRes),
        recipes: processResponse(recipesRes),
        equipment: processResponse(equipmentRes),
        menuSections: processResponse(menuSectionsRes),
        menus: processResponse(menusRes),
        lastUpdated: Date.now(),
        isLoading: false,
        error: null,
      };

      console.log(`[DataCache] Preloaded data:
        - Menu Items: ${newData.menuItems.length}
        - Ingredients: ${newData.ingredients.length}
        - Allergies: ${newData.allergies.length}
        - Recipes: ${newData.recipes.length}
        - Equipment: ${newData.equipment.length}
        - Menu Sections: ${newData.menuSections.length}
        - Menus: ${newData.menus.length}
      `);

      setData(newData);
    } catch (error) {
      console.error("[DataCache] Error loading data:", error);
      setData((prev) => ({
        ...(prev || {
          restaurantId: selectedRestaurant.restaurantId,
          menuItems: [],
          ingredients: [],
          allergies: [],
          recipes: [],
          equipment: [],
          menuSections: [],
          menus: [],
          lastUpdated: Date.now(),
        }),
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to load data",
      }));
    } finally {
      isLoadingRef.current = false;
      setIsLoadingData(false);
    }
  }, [
    getMenuItemsService,
    getIngredientsService,
    getAllergiesService,
    getRecipesService,
    getEquipmentService,
    getMenuSectionsService,
    getMenusService,
  ]);

  // Preload data when restaurant changes and user is authenticated
  useEffect(() => {
    if (!selectedRestaurant || !user) {
      return;
    }

    // Check if we already have data for this restaurant
    const hasDataForRestaurant =
      dataRef.current &&
      dataRef.current.restaurantId === selectedRestaurant.restaurantId;

    // Check if restaurant changed
    const restaurantChanged =
      lastRestaurantId.current !== selectedRestaurant.restaurantId;

    // Only reload if restaurant changed AND we don't have data for the new restaurant
    const shouldReload = restaurantChanged && !hasDataForRestaurant;

    if (shouldReload && !isLoadingRef.current) {
      console.log(
        `[DataCache] Triggering data load for new restaurant: ${selectedRestaurant.restaurantId}`
      );
      lastRestaurantId.current = selectedRestaurant.restaurantId;

      // Delay initial load to ensure auth is ready
      const timer = setTimeout(() => {
        loadAllData();
      }, 300);
      return () => clearTimeout(timer);
    } else if (hasDataForRestaurant) {
      console.log(
        `[DataCache] Data already exists for restaurant: ${selectedRestaurant.restaurantId}`
      );
      lastRestaurantId.current = selectedRestaurant.restaurantId;
    }
  }, [selectedRestaurant?.restaurantId, user?.id, loadAllData]);

  const refreshData = useCallback(async () => {
    await loadAllData();
  }, [loadAllData]);

  const clearCache = useCallback(() => {
    setData(null);
  }, []);

  const contextValue: RestaurantDataCacheContextType = {
    data,
    refreshData,
    clearCache,
  };

  return (
    <RestaurantDataCacheContext.Provider value={contextValue}>
      <DataPreloadModal
        opened={isLoadingData && !!selectedRestaurant && !!user}
        message={
          data?.error
            ? "Error loading data. Please refresh the page."
            : undefined
        }
      />
      {children}
    </RestaurantDataCacheContext.Provider>
  );
}

// Hook to use the restaurant data cache
export function useRestaurantDataCache() {
  const context = useContext(RestaurantDataCacheContext);
  if (!context) {
    throw new Error(
      "useRestaurantDataCache must be used within a RestaurantDataCacheProvider"
    );
  }
  return context;
}

// Convenience hooks for specific data types
export function useCachedMenuItems() {
  const { data } = useRestaurantDataCache();
  return data?.menuItems || [];
}

export function useCachedIngredients() {
  const { data } = useRestaurantDataCache();
  return data?.ingredients || [];
}

export function useCachedAllergies() {
  const { data } = useRestaurantDataCache();
  return data?.allergies || [];
}

export function useCachedRecipes() {
  const { data } = useRestaurantDataCache();
  return data?.recipes || [];
}

export function useCachedEquipment() {
  const { data } = useRestaurantDataCache();
  return data?.equipment || [];
}

export function useCachedMenuSections() {
  const { data } = useRestaurantDataCache();
  return data?.menuSections || [];
}

export function useCachedMenus() {
  const { data } = useRestaurantDataCache();
  return data?.menus || [];
}
