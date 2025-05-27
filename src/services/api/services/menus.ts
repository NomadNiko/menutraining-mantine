// src/services/api/services/menus.ts
import { InfinityPaginationType } from "../types/infinity-pagination";
import {
  Menu,
  CreateMenuDto,
  UpdateMenuDto,
  QueryMenuDto,
} from "../types/menu";
import {
  createGetService,
  createPostService,
  createPatchService,
  createDeleteService,
} from "../factory";

// Format query params for menus list endpoint
const formatMenusQueryParams = (params: QueryMenuDto) => {
  const searchParams = new URLSearchParams();
  searchParams.append("page", (params.page || 1).toString());
  searchParams.append("limit", (params.limit || 10).toString());
  if (params.name) {
    searchParams.append("name", params.name);
  }
  if (params.restaurantId) {
    searchParams.append("restaurantId", params.restaurantId);
  }
  if (params.activeDay) {
    searchParams.append("activeDay", params.activeDay);
  }
  return searchParams.toString();
};

// API Services for menu operations
export const useGetMenusService = createGetService<
  InfinityPaginationType<Menu>,
  void,
  QueryMenuDto
>("/v1/menus", {
  formatQueryParams: formatMenusQueryParams,
});

export const useGetMenuService = createGetService<Menu, { menuId: string }>(
  (params) => `/v1/menus/${params.menuId}`
);

export const useCreateMenuService = createPostService<CreateMenuDto, Menu>(
  "/v1/menus"
);

export const useUpdateMenuService = createPatchService<
  UpdateMenuDto,
  Menu,
  { menuId: string }
>((params) => `/v1/menus/${params.menuId}`);

export const useDeleteMenuService = createDeleteService<
  void,
  { menuId: string }
>((params) => `/v1/menus/${params.menuId}`);
