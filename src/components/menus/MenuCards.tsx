// src/components/menus/MenuCards.tsx (updated)
"use client";
import { Stack, Center, Loader, Text, SimpleGrid } from "@mantine/core";
import { MenuCard } from "./MenuCard";
import { useTranslation } from "@/services/i18n/client";
import { Menu } from "@/services/api/types/menu";
import { memo } from "react";

interface MenuCardsProps {
  menus: Menu[];
  loading?: boolean;
  onDelete: (id: string, name: string) => void;
  onView: (id: string) => void;
}

function MenuCardsComponent({
  menus,
  loading = false,
  onDelete,
  onView,
}: MenuCardsProps) {
  const { t } = useTranslation("restaurant-menus");

  if (menus.length === 0 && loading) {
    return (
      <Center p="xl">
        <Loader size="md" />
      </Center>
    );
  }

  if (menus.length === 0) {
    return (
      <Center p="xl">
        <Text>{t("noMenus")}</Text>
      </Center>
    );
  }

  return (
    <Stack gap="md">
      <SimpleGrid cols={1}>
        {menus.map((menu) => (
          <MenuCard
            key={menu.id}
            menu={menu}
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
export const MenuCards = memo(MenuCardsComponent);
