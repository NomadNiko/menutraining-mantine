// src/app/[language]/restaurant/quiz/layout.tsx
"use client";

import { QuizProvider } from "./context/quiz-context";

export default function QuizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <QuizProvider>{children}</QuizProvider>;
}
