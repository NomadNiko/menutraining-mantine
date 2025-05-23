// src/services/restaurant/restaurant-context-provider.tsx
"use client";
import { Restaurant } from "@/services/api/types/restaurant";
import { useGetRestaurantsService } from "@/services/api/services/restaurants";
import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  RestaurantContext,
  RestaurantActionsContext,
} from "./restaurant-context";
import useAuth from "@/services/auth/use-auth";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { RoleEnum } from "@/services/api/types/role";

const SELECTED_RESTAURANT_KEY = "selected-restaurant-id";

// Keys for localStorage items that should be cleared when restaurant changes
const CACHE_KEYS_TO_CLEAR = [
  "restaurant_quiz_state", // Quiz progress
  // Add other restaurant-specific cache keys here as needed
];

function RestaurantContextProvider({ children }: PropsWithChildren<{}>) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [availableRestaurants, setAvailableRestaurants] = useState<
    Restaurant[]
  >([]);
  const [selectedRestaurant, setSelectedRestaurant] =
    useState<Restaurant | null>(null);
  const { user, isLoaded: isAuthLoaded } = useAuth();
  const getRestaurantsService = useGetRestaurantsService();
  const queryClient = useQueryClient();
  const router = useRouter();

  // Check if user is admin
  const isAdmin = user?.role?.id === RoleEnum.ADMIN;

  // Load restaurants and set initial selection
  const loadRestaurants = useCallback(async () => {
    if (!isAuthLoaded || !user) {
      setIsLoaded(true);
      return;
    }

    try {
      console.log("Loading restaurants...", { isAdmin });
      const { status, data } = await getRestaurantsService(undefined, {
        page: 1,
        limit: 100, // For admins, this will get all restaurants they have access to (which should be all)
      });

      if (status === HTTP_CODES_ENUM.OK) {
        const restaurantsArray = Array.isArray(data) ? data : data?.data || [];
        console.log("Loaded restaurants:", restaurantsArray);
        setAvailableRestaurants(restaurantsArray);

        if (restaurantsArray.length > 0) {
          const savedRestaurantId = localStorage.getItem(
            SELECTED_RESTAURANT_KEY
          );
          let restaurantToSelect;

          if (savedRestaurantId) {
            restaurantToSelect =
              restaurantsArray.find((r) => r.id === savedRestaurantId) ||
              restaurantsArray[0];
          } else {
            restaurantToSelect = restaurantsArray[0];
          }

          console.log("Setting selected restaurant:", restaurantToSelect);
          setSelectedRestaurant(restaurantToSelect);
          localStorage.setItem(SELECTED_RESTAURANT_KEY, restaurantToSelect.id);
        }
      }
    } catch (error) {
      console.error("Error loading restaurants:", error);
    } finally {
      setIsLoaded(true);
    }
  }, [getRestaurantsService, user, isAuthLoaded, isAdmin]);

  // Initial load
  useEffect(() => {
    if (isAuthLoaded) {
      loadRestaurants();
    }
  }, [loadRestaurants, isAuthLoaded]);

  const clearRestaurantCache = useCallback(() => {
    // Clear specific localStorage keys
    CACHE_KEYS_TO_CLEAR.forEach((key) => {
      if (typeof window !== "undefined") {
        localStorage.removeItem(key);
      }
    });
    // Clear React Query cache
    queryClient.clear();
    console.log("Cleared restaurant-specific cache");
  }, [queryClient]);

  const handleSetSelectedRestaurant = useCallback(
    (restaurant: Restaurant) => {
      const currentRestaurantId = selectedRestaurant?.id;
      const newRestaurantId = restaurant.id;
      console.log("Manually setting selected restaurant:", restaurant);

      // Only proceed if the restaurant is actually changing
      if (currentRestaurantId !== newRestaurantId) {
        setSelectedRestaurant(restaurant);
        localStorage.setItem(SELECTED_RESTAURANT_KEY, restaurant.id);

        // Clear cache and refresh page
        clearRestaurantCache();

        // Refresh the current page to ensure all components reinitialize
        router.refresh();

        // Force a full page reload to ensure complete state reset
        if (typeof window !== "undefined") {
          window.location.reload();
        }
      }
    },
    [selectedRestaurant?.id, clearRestaurantCache, router]
  );

  const contextValue = useMemo(
    () => ({
      selectedRestaurant,
      availableRestaurants,
      isLoaded,
    }),
    [selectedRestaurant, availableRestaurants, isLoaded]
  );

  const actionsValue = useMemo(
    () => ({
      setSelectedRestaurant: handleSetSelectedRestaurant,
      loadRestaurants,
    }),
    [handleSetSelectedRestaurant, loadRestaurants]
  );

  return (
    <RestaurantContext.Provider value={contextValue}>
      <RestaurantActionsContext.Provider value={actionsValue}>
        {children}
      </RestaurantActionsContext.Provider>
    </RestaurantContext.Provider>
  );
}

export default RestaurantContextProvider;
