// src/components/equipment/EquipmentCards.tsx
import { useEffect, useRef } from "react";
import { Stack, Center, Loader, Text } from "@mantine/core";
import { Equipment } from "@/services/api/types/equipment";
import { EquipmentCard } from "./EquipmentCard";
import { useTranslation } from "@/services/i18n/client";

interface EquipmentCardsProps {
  equipment: Equipment[];
  handleLoadMore: () => void;
  hasMore: boolean;
  loading: boolean;
  onDelete: (id: string, name: string) => void;
}

export function EquipmentCards({
  equipment,
  handleLoadMore,
  hasMore,
  loading,
  onDelete,
}: EquipmentCardsProps) {
  const { t } = useTranslation("admin-panel-equipment");
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

  if (equipment.length === 0 && loading) {
    return (
      <Center p="xl">
        <Loader size="md" />
      </Center>
    );
  }

  if (equipment.length === 0) {
    return (
      <Center p="xl">
        <Text>{t("noEquipment")}</Text>
      </Center>
    );
  }

  return (
    <Stack gap="md">
      {equipment.map((item) => (
        <EquipmentCard key={item.id} equipment={item} onDelete={onDelete} />
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
