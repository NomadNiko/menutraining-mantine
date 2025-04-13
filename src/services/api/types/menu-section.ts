// src/services/api/types/menu-section.ts
export type SectionItem = {
  menuItemId: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  order: number;
};

export type MenuSection = {
  id: string;
  menuSectionId: string;
  title: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  items: SectionItem[];
  restaurantId: string;
};

export type CreateSectionItemDto = {
  menuItemId: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  order?: number;
};

export type CreateMenuSectionDto = {
  title: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  items: CreateSectionItemDto[];
  restaurantId: string;
};

export type UpdateMenuSectionDto = Partial<CreateMenuSectionDto>;

export type QueryMenuSectionDto = {
  page?: number;
  limit?: number;
  title?: string;
  restaurantId?: string;
};
