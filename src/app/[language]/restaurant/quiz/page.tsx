// src/app/[language]/restaurant/quiz/page.tsx
import type { Metadata } from "next";
import { getServerTranslation } from "@/services/i18n";
import QuizLandingPage from "./page-content";

type Props = {
  params: Promise<{ language: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const { t } = await getServerTranslation(params.language, "restaurant-quiz");
  return {
    title: t("quiz.title"),
  };
}

export default function Page() {
  return <QuizLandingPage />;
}
