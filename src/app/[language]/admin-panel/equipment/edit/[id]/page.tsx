// src/app/[language]/admin-panel/equipment/edit/[id]/page.tsx
import type { Metadata } from "next";
import EditEquipment from "./page-content";
import { getServerTranslation } from "@/services/i18n";

type Props = {
  params: Promise<{ language: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const { t } = await getServerTranslation(
    params.language,
    "admin-panel-equipment"
  );
  return {
    title: t("editTitle"),
  };
}

export default function Page() {
  return <EditEquipment />;
}
