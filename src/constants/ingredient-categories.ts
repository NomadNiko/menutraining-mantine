export const INGREDIENT_CATEGORIES = {
  basic: "Basic",
  meatsPoultry: "Meats & Poultry",
  seafood: "Seafood",
  dairy: "Dairy",
  vegetables: "Vegetables",
  fruits: "Fruits",
  grainsCereals: "Grains & Cereals",
  baking: "Baking",
  nutsSeeds: "Nuts & Seeds",
  oilsFats: "Oils & Fats",
  herbsSpices: "Herbs & Spices",
  condimentsSauces: "Condiments & Sauces",
  juicesFluids: "Juices & Fluids",
} as const;

export type IngredientCategory = keyof typeof INGREDIENT_CATEGORIES;
export const CATEGORY_KEYS = Object.keys(
  INGREDIENT_CATEGORIES
) as IngredientCategory[];
