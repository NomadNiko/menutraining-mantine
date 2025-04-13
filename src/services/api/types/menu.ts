// src/services/api/types/menu.ts
export enum DayOfWeek {
  MONDAY = "monday",
  TUESDAY = "tuesday",
  WEDNESDAY = "wednesday",
  THURSDAY = "thursday",
  FRIDAY = "friday",
  SATURDAY = "saturday",
  SUNDAY = "sunday",
}

export type Menu = {
  id: string;
  menuId: string;
  name: string;
  description?: string;
  activeDays: DayOfWeek[];
  startTime?: string;
  endTime?: string;
  menuSections: string[];
  restaurantId: string;
};

export type CreateMenuDto = {
  name: string;
  description?: string;
  activeDays: DayOfWeek[];
  startTime?: string;
  endTime?: string;
  menuSections: string[];
  restaurantId: string;
};

export type UpdateMenuDto = Partial<CreateMenuDto>;

export type QueryMenuDto = {
  page?: number;
  limit?: number;
  name?: string;
  restaurantId?: string;
  activeDay?: DayOfWeek;
};
