// src/services/api/services/equipment.ts
import { InfinityPaginationType } from "../types/infinity-pagination";
import {
  Equipment,
  EquipmentPostRequest,
  EquipmentPatchRequest,
} from "../types/equipment";
import {
  createGetService,
  createPostService,
  createPatchService,
  createDeleteService,
} from "../factory";

// Format query params for equipment list endpoint
const formatEquipmentQueryParams = (params: {
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

// API Services for equipment operations
export const useGetEquipmentService = createGetService<
  InfinityPaginationType<Equipment>,
  void,
  { page: number; limit: number; name?: string }
>("/v1/equipment", {
  formatQueryParams: formatEquipmentQueryParams,
});

export const useGetEquipmentItemService = createGetService<
  Equipment,
  { equipmentId: string }
>((params) => `/v1/equipment/${params.equipmentId}`);

export const usePostEquipmentService = createPostService<
  EquipmentPostRequest,
  Equipment
>("/v1/equipment");

export const usePatchEquipmentService = createPatchService<
  EquipmentPatchRequest,
  Equipment,
  { equipmentId: string }
>((params) => `/v1/equipment/${params.equipmentId}`);

export const useDeleteEquipmentService = createDeleteService<
  void,
  { equipmentId: string }
>((params) => `/v1/equipment/${params.equipmentId}`);
