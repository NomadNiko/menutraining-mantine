// src/app/[language]/restaurant/recipes/[id]/edit-streamlined/page.tsx
import RouteGuard from "@/services/auth/route-guard";
import EditRecipeStreamlined from "./page-content";

export default function EditRecipeStreamlinedPage() {
  return (
    <RouteGuard>
      <EditRecipeStreamlined />
    </RouteGuard>
  );
}
