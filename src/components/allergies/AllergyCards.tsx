import { useEffect, useRef } from "react";
import { Stack, Center, Loader, Text } from "@mantine/core";
import { Allergy } from "@/services/api/types/allergy";
import { AllergyCard } from "./AllergyCard";
import { useTranslation } from "@/services/i18n/client";

interface AllergyCardsProps {
  allergies: Allergy[];
  handleLoadMore: () => void;
  hasMore: boolean;
  loading: boolean;
  onDelete: (id: string, name: string) => void;
}

export function AllergyCards({
  allergies,
  handleLoadMore,
  hasMore,
  loading,
  onDelete,
}: AllergyCardsProps) {
  const { t } = useTranslation("admin-panel-allergies");
  const observerTarget = useRef<HTMLDivElement>(null);

  // Set up intersection observer for infinite scrolling
  useEffect(() => {
    const currentTarget = observerTarget.current;
    if (!currentTarget || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(currentTarget);

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [handleLoadMore, hasMore, loading]);

  if (allergies.length === 0 && loading) {
    return (
      <Center p="xl">
        <Loader size="md" />
      </Center>
    );
  }

  if (allergies.length === 0) {
    return (
      <Center p="xl">
        <Text>{t("noAllergies")}</Text>
      </Center>
    );
  }

  return (
    <Stack gap="md">
      {allergies.map((allergy) => (
        <AllergyCard key={allergy.id} allergy={allergy} onDelete={onDelete} />
      ))}

      {/* Loader for fetching next page */}
      {loading && hasMore && (
        <Center p="md">
          <Loader size="sm" />
        </Center>
      )}

      {/* Invisible element for intersection observer */}
      <div ref={observerTarget} style={{ height: 10 }}></div>
    </Stack>
  );
}
