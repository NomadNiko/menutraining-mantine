// src/app/[language]/admin-panel/ingredients/edit/[id]/page.tsx
import type { Metadata } from "next";
import { getServerTranslation } from "@/services/i18n";
import EditIngredient from "./page-content";

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
    title: t("editTitle"),
  };
}

export default function Page() {
  return <EditIngredient />;
}
