// src/app/[language]/restaurant/recipes/edit/[id]/page.tsx
import type { Metadata } from "next";
import { getServerTranslation } from "@/services/i18n";
import EditRecipe from "./page-content";

type Props = {
  params: Promise<{ language: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const { t } = await getServerTranslation(
    params.language,
    "restaurant-recipes"
  );
  return {
    title: t("editTitle"),
  };
}

export default function Page() {
  return <EditRecipe />;
}
