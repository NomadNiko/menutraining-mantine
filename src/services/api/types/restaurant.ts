// src/services/api/types/restaurant.ts
import { InfinityPaginationType } from "./infinity-pagination";

export type Restaurant = {
  id: string;
  restaurantId: string;
  name: string;
  description?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  createdBy: string;
  associatedUsers: string[];
};

export type RestaurantsRequest = {
  page: number;
  limit: number;
  name?: string;
};

export type RestaurantsResponse = InfinityPaginationType<Restaurant>;

export type RestaurantRequest = {
  id: string;
};

export type RestaurantResponse = Restaurant;

export type RestaurantPostRequest = {
  name: string;
  description?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
};

export type RestaurantPatchRequest = {
  name?: string;
  description?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
};

export type RestaurantDeleteResponse = void;

export type UserRestaurantRequest = {
  userId: string;
};
