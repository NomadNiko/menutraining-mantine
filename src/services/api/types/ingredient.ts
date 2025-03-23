export type Ingredient = {
  id: string;
  ingredientId: string;
  ingredientName: string;
  ingredientAllergies: string[];
  ingredientImageUrl?: string | null;
  subIngredients: string[];
  restaurantId: string;
  derivedAllergies?: string[];
  categories: string[];
};

export type CreateIngredientDto = {
  ingredientName: string;
  ingredientAllergies: string[];
  ingredientImageUrl?: string | null;
  subIngredients?: string[];
  restaurantId: string;
  categories: string[];
};

export type UpdateIngredientDto = Partial<CreateIngredientDto>;

export type QueryIngredientDto = {
  page?: number;
  limit?: number;
  name?: string;
  restaurantId?: string;
  allergyId?: string;
  category?: string;
};
