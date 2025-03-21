// src/app/[language]/admin-panel/ingredients/create/[restaurantId]/page.tsx
import type { Metadata } from "next";
import { getServerTranslation } from "@/services/i18n";
import CreateIngredient from "./page-content";

type Props = {
  params: Promise<{ language: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const { t } = await getServerTranslation(
    params.language,
    "admin-panel-ingredients"
  );
  return {
    title: t("createTitle"),
  };
}

export default function Page() {
  return <CreateIngredient />;
}
