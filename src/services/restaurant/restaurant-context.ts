"use client";
import { Restaurant } from "@/services/api/types/restaurant";
import { createContext } from "react";

export type RestaurantContextType = {
  selectedRestaurant: Restaurant | null;
  availableRestaurants: Restaurant[];
  isLoaded: boolean;
};

export const RestaurantContext = createContext<RestaurantContextType>({
  selectedRestaurant: null,
  availableRestaurants: [],
  isLoaded: false,
});

export const RestaurantActionsContext = createContext<{
  setSelectedRestaurant: (restaurant: Restaurant) => void;
  loadRestaurants: () => Promise<void>;
}>({
  setSelectedRestaurant: () => {},
  loadRestaurants: async () => {},
});
