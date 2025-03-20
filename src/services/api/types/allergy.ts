import { InfinityPaginationType } from "./infinity-pagination";

export type Allergy = {
  id: string;
  allergyId: string;
  allergyName: string;
  allergyLogoUrl?: string | null;
};

export type AllergiesRequest = {
  page: number;
  limit: number;
  name?: string;
};

export type AllergiesResponse = InfinityPaginationType<Allergy>;

export type AllergyRequest = {
  id: string;
};

export type AllergyResponse = Allergy;

export type AllergyPostRequest = {
  allergyName: string;
  allergyLogoUrl?: string | null;
};

export type AllergyPatchRequest = {
  allergyName?: string;
  allergyLogoUrl?: string | null;
};

export type AllergyDeleteResponse = void;
