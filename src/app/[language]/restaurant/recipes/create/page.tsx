// src/app/[language]/restaurant/recipes/create/page.tsx
import type { Metadata } from "next";
import { getServerTranslation } from "@/services/i18n";
import CreateRecipe from "./page-content";

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
    title: t("createTitle"),
  };
}

export default function Page() {
  return <CreateRecipe />;
}
