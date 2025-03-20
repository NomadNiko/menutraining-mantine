import { InfinityPaginationType } from "../types/infinity-pagination";
import {
  Restaurant,
  RestaurantPostRequest,
  RestaurantPatchRequest,
  UserRestaurantRequest,
} from "../types/restaurant";
import { User } from "../types/user";
import {
  createGetService,
  createPostService,
  createPatchService,
  createDeleteService,
} from "../factory";

// Format query params for restaurants list endpoint
const formatRestaurantsQueryParams = (params: {
  page: number;
  limit: number;
  name?: string;
}) => {
  const searchParams = new URLSearchParams();
  searchParams.append("page", params.page.toString());
  searchParams.append("limit", params.limit.toString());
  if (params.name) {
    searchParams.append("name", params.name);
  }
  return searchParams.toString();
};

// API Services for restaurant operations
export const useGetRestaurantsService = createGetService<
  InfinityPaginationType<Restaurant>,
  void,
  { page: number; limit: number; name?: string }
>("/v1/restaurants", {
  formatQueryParams: formatRestaurantsQueryParams,
});

export const useGetRestaurantService = createGetService<
  Restaurant,
  { id: string }
>((params) => `/v1/restaurants/${params.id}`);

export const useGetRestaurantByCodeService = createGetService<
  Restaurant,
  { restaurantId: string }
>((params) => `/v1/restaurants/code/${params.restaurantId}`);

export const usePostRestaurantService = createPostService<
  RestaurantPostRequest,
  Restaurant
>("/v1/restaurants");

export const usePatchRestaurantService = createPatchService<
  RestaurantPatchRequest,
  Restaurant,
  { id: string }
>((params) => `/v1/restaurants/${params.id}`);

export const useDeleteRestaurantService = createDeleteService<
  void,
  { id: string }
>((params) => `/v1/restaurants/${params.id}`);

// API Services for restaurant user management
export const useAddUserToRestaurantService = createPostService<
  UserRestaurantRequest,
  Restaurant,
  { restaurantId: string }
>((params) => `/v1/restaurants/${params.restaurantId}/users`);

export const useRemoveUserFromRestaurantService = createDeleteService<
  Restaurant,
  { restaurantId: string; userId: string }
>((params) => `/v1/restaurants/${params.restaurantId}/users/${params.userId}`);

export const useGetRestaurantUsersService = createGetService<
  User[],
  { restaurantId: string }
>((params) => `/v1/restaurants/${params.restaurantId}/users`);
