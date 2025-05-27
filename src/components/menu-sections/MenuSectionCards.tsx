// src/components/menu-sections/MenuSectionCards.tsx
"use client";
import { Stack, Center, Loader, Text, SimpleGrid } from "@mantine/core";
import { MenuSectionCard } from "./MenuSectionCard";
import { useTranslation } from "@/services/i18n/client";
import { MenuSection } from "@/services/api/types/menu-section";
import { memo } from "react";

interface MenuSectionCardsProps {
  menuSections: MenuSection[];
  loading?: boolean;
  onDelete: (id: string, title: string) => void;
  onView?: (id: string) => void;
}

function MenuSectionCardsComponent({
  menuSections,
  loading = false,
  onDelete,
  onView,
}: MenuSectionCardsProps) {
  const { t } = useTranslation("restaurant-menu-sections");

  if (menuSections.length === 0 && loading) {
    return (
      <Center p="xl">
        <Loader size="md" />
      </Center>
    );
  }

  if (menuSections.length === 0) {
    return (
      <Center p="xl">
        <Text>{t("noMenuSections")}</Text>
      </Center>
    );
  }

  return (
    <Stack gap="md">
      <SimpleGrid cols={1}>
        {menuSections.map((section) => (
          <MenuSectionCard
            key={section.menuSectionId}
            menuSection={section}
            onDelete={onDelete}
            onView={onView}
          />
        ))}
      </SimpleGrid>
      {loading && (
        <Center p="md">
          <Loader size="sm" />
        </Center>
      )}
    </Stack>
  );
}

// Memoize the component to prevent unnecessary re-renders
export const MenuSectionCards = memo(MenuSectionCardsComponent);
