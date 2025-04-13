// src/services/api/types/equipment.ts
import { InfinityPaginationType } from "./infinity-pagination";

export type Equipment = {
  id: string;
  equipmentId: string;
  equipmentName: string;
  equipmentImageUrl?: string | null;
};

export type EquipmentsRequest = {
  page: number;
  limit: number;
  name?: string;
};

export type EquipmentsResponse = InfinityPaginationType<Equipment>;

export type EquipmentRequest = {
  id: string;
};

export type EquipmentResponse = Equipment;

export type EquipmentPostRequest = {
  equipmentName: string;
  equipmentImageUrl?: string | null;
};

export type EquipmentPatchRequest = {
  equipmentName?: string;
  equipmentImageUrl?: string | null;
};

export type EquipmentDeleteResponse = void;
