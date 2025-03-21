export type MenuItem = {
  id: string;
  menuItemId: string;
  menuItemName: string;
  menuItemDescription?: string | null;
  menuItemIngredients: string[];
  menuItemUrl?: string | null;
  restaurantId: string;
};

export type CreateMenuItemDto = {
  menuItemName: string;
  menuItemDescription?: string | null;
  menuItemIngredients: string[];
  menuItemUrl?: string | null;
  restaurantId: string;
};

export type UpdateMenuItemDto = Partial<CreateMenuItemDto>;

export type QueryMenuItemDto = {
  page?: number;
  limit?: number;
  restaurantId?: string;
  ingredientId?: string;
};
