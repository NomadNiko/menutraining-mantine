"use client";
import { useContext } from "react";
import {
  RestaurantContext,
  RestaurantActionsContext,
} from "./restaurant-context";

function useSelectedRestaurant() {
  const { selectedRestaurant, availableRestaurants, isLoaded } =
    useContext(RestaurantContext);
  const { setSelectedRestaurant, loadRestaurants } = useContext(
    RestaurantActionsContext
  );

  return {
    selectedRestaurant,
    availableRestaurants,
    isLoaded,
    setSelectedRestaurant,
    loadRestaurants,
    selectedRestaurantId: selectedRestaurant?.id || null,
  };
}

export default useSelectedRestaurant;
