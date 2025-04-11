"use client";
import { Button, Center } from "@mantine/core";
import { useTranslation } from "@/services/i18n/client";

interface LoadMoreButtonProps {
  onClick: () => void;
  hasMore: boolean;
  isLoading?: boolean;
}

export function LoadMoreButton({
  onClick,
  hasMore,
  isLoading = false,
}: LoadMoreButtonProps) {
  const { t } = useTranslation("admin-panel-menu-items");

  if (!hasMore) {
    return null;
  }

  return (
    <Center mt="md">
      <Button
        onClick={onClick}
        disabled={isLoading}
        size="sm"
        data-testid="load-more-button"
      >
        {t("loadMore")}
      </Button>
    </Center>
  );
}
