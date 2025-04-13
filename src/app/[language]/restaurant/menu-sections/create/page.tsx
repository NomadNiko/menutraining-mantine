// src/app/[language]/restaurant/menu-sections/create/page.tsx
import type { Metadata } from "next";
import { getServerTranslation } from "@/services/i18n";
import CreateMenuSection from "./page-content";

type Props = {
  params: Promise<{ language: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const { t } = await getServerTranslation(
    params.language,
    "restaurant-menu-sections"
  );
  return {
    title: t("createTitle"),
  };
}

export default function Page() {
  return <CreateMenuSection />;
}
