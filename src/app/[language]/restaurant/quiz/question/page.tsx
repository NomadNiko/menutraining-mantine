// src/app/[language]/restaurant/quiz/question/page.tsx
import type { Metadata } from "next";
import { getServerTranslation } from "@/services/i18n";
import QuizQuestionPage from "./page-content";

type Props = {
  params: Promise<{ language: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const { t } = await getServerTranslation(params.language, "restaurant-quiz");
  return {
    title: t("quiz.questionTitle"),
  };
}

export default function Page() {
  return <QuizQuestionPage />;
}
