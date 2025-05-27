// src/app/[language]/restaurant/recipes/create-streamlined/page.tsx
import RouteGuard from "@/services/auth/route-guard";
import CreateRecipeStreamlined from "./page-content";

export default function CreateRecipeStreamlinedPage() {
  return (
    <RouteGuard>
      <CreateRecipeStreamlined />
    </RouteGuard>
  );
}
