// src/services/api/services/recipes.ts
import { InfinityPaginationType } from "../types/infinity-pagination";
import {
  Recipe,
  CreateRecipeDto,
  UpdateRecipeDto,
  QueryRecipeDto,
} from "../types/recipe";
import {
  createGetService,
  createPostService,
  createPatchService,
  createDeleteService,
} from "../factory";

// Format query params for recipes list endpoint
const formatRecipesQueryParams = (params: QueryRecipeDto) => {
  const searchParams = new URLSearchParams();
  searchParams.append("page", (params.page || 1).toString());
  searchParams.append("limit", (params.limit || 10).toString());
  if (params.name) {
    searchParams.append("name", params.name);
  }
  if (params.restaurantId) {
    searchParams.append("restaurantId", params.restaurantId);
  }
  if (params.ingredientId) {
    searchParams.append("ingredientId", params.ingredientId);
  }
  if (params.equipmentId) {
    searchParams.append("equipmentId", params.equipmentId);
  }
  if (params.maxPrepTime) {
    searchParams.append("maxPrepTime", params.maxPrepTime.toString());
  }
  return searchParams.toString();
};

// API Services for recipe operations
export const useGetRecipesService = createGetService<
  InfinityPaginationType<Recipe>,
  void,
  QueryRecipeDto
>("/v1/recipes", {
  formatQueryParams: formatRecipesQueryParams,
});

export const useGetRecipeService = createGetService<
  Recipe,
  { recipeId: string }
>((params) => `/v1/recipes/${params.recipeId}`);

export const useCreateRecipeService = createPostService<
  CreateRecipeDto,
  Recipe
>("/v1/recipes");

export const useUpdateRecipeService = createPatchService<
  UpdateRecipeDto,
  Recipe,
  { recipeId: string }
>((params) => `/v1/recipes/${params.recipeId}`);

export const useDeleteRecipeService = createDeleteService<
  void,
  { recipeId: string }
>((params) => `/v1/recipes/${params.recipeId}`);
