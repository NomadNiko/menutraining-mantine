// src/services/api/services/menu-sections.ts
import { InfinityPaginationType } from "../types/infinity-pagination";
import {
  MenuSection,
  CreateMenuSectionDto,
  UpdateMenuSectionDto,
  QueryMenuSectionDto,
} from "../types/menu-section";
import {
  createGetService,
  createPostService,
  createPatchService,
  createDeleteService,
} from "../factory";

// Format query params for menu sections list endpoint
const formatMenuSectionsQueryParams = (params: QueryMenuSectionDto) => {
  const searchParams = new URLSearchParams();
  searchParams.append("page", (params.page || 1).toString());
  searchParams.append("limit", (params.limit || 10).toString());
  if (params.title) {
    searchParams.append("title", params.title);
  }
  if (params.restaurantId) {
    searchParams.append("restaurantId", params.restaurantId);
  }
  return searchParams.toString();
};

// API Services for menu section operations
export const useGetMenuSectionsService = createGetService<
  InfinityPaginationType<MenuSection>,
  void,
  QueryMenuSectionDto
>("/v1/menu-sections", {
  formatQueryParams: formatMenuSectionsQueryParams,
});

export const useGetMenuSectionService = createGetService<
  MenuSection,
  { menuSectionId: string }
>((params) => `/v1/menu-sections/${params.menuSectionId}`);

export const useCreateMenuSectionService = createPostService<
  CreateMenuSectionDto,
  MenuSection
>("/v1/menu-sections");

export const useUpdateMenuSectionService = createPatchService<
  UpdateMenuSectionDto,
  MenuSection,
  { menuSectionId: string }
>((params) => `/v1/menu-sections/${params.menuSectionId}`);

export const useDeleteMenuSectionService = createDeleteService<
  void,
  { menuSectionId: string }
>((params) => `/v1/menu-sections/${params.menuSectionId}`);
