// src/services/api/services/ingredients.ts
import { InfinityPaginationType } from "../types/infinity-pagination";
import {
  Ingredient,
  CreateIngredientDto,
  UpdateIngredientDto,
  QueryIngredientDto,
} from "../types/ingredient";
import {
  createGetService,
  createPostService,
  createPatchService,
  createDeleteService,
} from "../factory";

// Format query params for ingredients list endpoint
const formatIngredientsQueryParams = (params: QueryIngredientDto) => {
  const searchParams = new URLSearchParams();
  searchParams.append("page", (params.page || 1).toString());
  searchParams.append("limit", (params.limit || 10).toString());
  if (params.name) {
    searchParams.append("name", params.name);
  }
  if (params.restaurantId) {
    searchParams.append("restaurantId", params.restaurantId);
  }
  if (params.allergyId) {
    searchParams.append("allergyId", params.allergyId);
  }
  return searchParams.toString();
};

// API Services for ingredient operations
export const useGetIngredientsService = createGetService<
  InfinityPaginationType<Ingredient>,
  void,
  QueryIngredientDto
>("/v1/ingredients", {
  formatQueryParams: formatIngredientsQueryParams,
});

export const useGetIngredientService = createGetService<
  Ingredient,
  { ingredientId: string }
>((params) => `/v1/ingredients/${params.ingredientId}`);

export const useCreateIngredientService = createPostService<
  CreateIngredientDto,
  Ingredient
>("/v1/ingredients");

export const useUpdateIngredientService = createPatchService<
  UpdateIngredientDto,
  Ingredient,
  { ingredientId: string }
>((params) => `/v1/ingredients/${params.ingredientId}`);

export const useDeleteIngredientService = createDeleteService<
  void,
  { ingredientId: string }
>((params) => `/v1/ingredients/${params.ingredientId}`);
