import { InfinityPaginationType } from "../types/infinity-pagination";
import {
  Allergy,
  AllergyPostRequest,
  AllergyPatchRequest,
} from "../types/allergy";
import {
  createGetService,
  createPostService,
  createPatchService,
  createDeleteService,
} from "../factory";

// Format query params for allergies list endpoint
const formatAllergiesQueryParams = (params: {
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

// API Services for allergy operations
export const useGetAllergiesService = createGetService<
  InfinityPaginationType<Allergy>,
  void,
  { page: number; limit: number; name?: string }
>("/v1/allergies", {
  formatQueryParams: formatAllergiesQueryParams,
});

export const useGetAllergyService = createGetService<
  Allergy,
  { allergyId: string }
>((params) => `/v1/allergies/${params.allergyId}`);

export const usePostAllergyService = createPostService<
  AllergyPostRequest,
  Allergy
>("/v1/allergies");

export const usePatchAllergyService = createPatchService<
  AllergyPatchRequest,
  Allergy,
  { allergyId: string }
>((params) => `/v1/allergies/${params.allergyId}`);

export const useDeleteAllergyService = createDeleteService<
  void,
  { allergyId: string }
>((params) => `/v1/allergies/${params.allergyId}`);
