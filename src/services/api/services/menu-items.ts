import { InfinityPaginationType } from "../types/infinity-pagination";
import {
  MenuItem,
  CreateMenuItemDto,
  UpdateMenuItemDto,
  QueryMenuItemDto,
} from "../types/menu-item";
import {
  createGetService,
  createPostService,
  createPatchService,
  createDeleteService,
} from "../factory";

// Format query params for menu items list endpoint
const formatMenuItemsQueryParams = (params: QueryMenuItemDto) => {
  const searchParams = new URLSearchParams();
  searchParams.append("page", (params.page || 1).toString());
  searchParams.append("limit", (params.limit || 10).toString());
  if (params.restaurantId) {
    searchParams.append("restaurantId", params.restaurantId);
  }
  if (params.ingredientId) {
    searchParams.append("ingredientId", params.ingredientId);
  }
  return searchParams.toString();
};

// API Services for menu item operations
export const useGetMenuItemsService = createGetService<
  InfinityPaginationType<MenuItem>,
  void,
  QueryMenuItemDto
>("/v1/menu-items", {
  formatQueryParams: formatMenuItemsQueryParams,
});

export const useGetMenuItemService = createGetService<MenuItem, { id: string }>(
  (params) => `/v1/menu-items/${params.id}`
);

export const useGetMenuItemByCodeService = createGetService<
  MenuItem,
  { menuItemId: string }
>((params) => `/v1/menu-items/code/${params.menuItemId}`);

export const useCreateMenuItemService = createPostService<
  CreateMenuItemDto,
  MenuItem
>("/v1/menu-items");

export const useUpdateMenuItemService = createPatchService<
  UpdateMenuItemDto,
  MenuItem,
  { id: string }
>((params) => `/v1/menu-items/${params.id}`);

export const useDeleteMenuItemService = createDeleteService<
  void,
  { id: string }
>((params) => `/v1/menu-items/${params.id}`);
