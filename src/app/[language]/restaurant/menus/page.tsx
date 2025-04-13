// src/app/[language]/restaurant/menus/page.tsx
import type { Metadata } from "next";
import { getServerTranslation } from "@/services/i18n";
import MenusPage from "./page-content";

type Props = {
  params: Promise<{ language: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const { t } = await getServerTranslation(params.language, "restaurant-menus");
  return {
    title: t("title"),
  };
}

export default function Page() {
  return <MenusPage />;
}
