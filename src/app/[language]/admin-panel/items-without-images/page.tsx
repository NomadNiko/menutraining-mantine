import type { Metadata } from "next";
import ItemsWithoutImages from "./page-content";
import { getServerTranslation } from "@/services/i18n";

type Props = {
  params: Promise<{ language: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const { t } = await getServerTranslation(
    params.language,
    "admin-panel-items-without-images"
  );

  return {
    title: t("itemsWithoutImages.metaTitle"),
  };
}

export default function ItemsWithoutImagesPage() {
  return <ItemsWithoutImages />;
}
