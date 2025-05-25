// src/app/[language]/restaurant/recipes/view/[id]/page.tsx
import { Metadata } from "next";
import { RecipeViewPageContent } from "./page-content";

type RecipeViewPageProps = {
  params: Promise<{ language: string; id: string }>;
};

export async function generateMetadata(
  props: RecipeViewPageProps
): Promise<Metadata> {
  await props.params;

  // Here you would normally fetch the recipe data to get the title
  // For now, we'll use a generic title
  return {
    title: `Recipe Details`,
  };
}

export default async function RecipeViewPage(props: RecipeViewPageProps) {
  const params = await props.params;
  const { id } = params;

  return <RecipeViewPageContent recipeId={id} />;
}
