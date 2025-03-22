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

const SELECTED_RESTAURANT_KEY = "selected-restaurant-id";

function RestaurantContextProvider({ children }: PropsWithChildren<{}>) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [availableRestaurants, setAvailableRestaurants] = useState<
    Restaurant[]
  >([]);
  const [selectedRestaurant, setSelectedRestaurant] =
    useState<Restaurant | null>(null);

  const { user, isLoaded: isAuthLoaded } = useAuth();
  const getRestaurantsService = useGetRestaurantsService();

  // Load restaurants and set initial selection
  const loadRestaurants = useCallback(async () => {
    if (!isAuthLoaded || !user) {
      setIsLoaded(true);
      return;
    }

    try {
      console.log("Loading restaurants...");
      const { status, data } = await getRestaurantsService(undefined, {
        page: 1,
        limit: 100,
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
  }, [getRestaurantsService, user, isAuthLoaded]);

  // Initial load
  useEffect(() => {
    if (isAuthLoaded) {
      loadRestaurants();
    }
  }, [loadRestaurants, isAuthLoaded]);

  const handleSetSelectedRestaurant = useCallback((restaurant: Restaurant) => {
    console.log("Manually setting selected restaurant:", restaurant);
    setSelectedRestaurant(restaurant);
    localStorage.setItem(SELECTED_RESTAURANT_KEY, restaurant.id);
  }, []);

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
