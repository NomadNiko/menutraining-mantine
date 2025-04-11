// src/components/menu-items/MenuItemCards.tsx
"use client";
import { Stack, Center, Loader, Text, SimpleGrid } from "@mantine/core";
import { MenuItemCard } from "./MenuItemCard";
import { useTranslation } from "@/services/i18n/client";
import { MenuItem } from "@/services/api/types/menu-item";
import { memo } from "react";

interface MenuItemCardsProps {
  menuItems: MenuItem[];
  allergiesMap: { [key: string]: string };
  loading?: boolean;
  onDelete: (id: string, name: string) => void;
}

function MenuItemCardsComponent({
  menuItems,
  allergiesMap,
  loading = false,
  onDelete,
}: MenuItemCardsProps) {
  const { t } = useTranslation("admin-panel-menu-items");

  if (menuItems.length === 0 && loading) {
    return (
      <Center p="xl">
        <Loader size="md" />
      </Center>
    );
  }

  if (menuItems.length === 0) {
    return (
      <Center p="xl">
        <Text>{t("noMenuItems")}</Text>
      </Center>
    );
  }

  return (
    <Stack gap="md">
      <SimpleGrid cols={1}>
        {menuItems.map((menuItem) => (
          <MenuItemCard
            key={menuItem.id}
            menuItem={menuItem}
            allergiesMap={allergiesMap}
            onDelete={onDelete}
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
export const MenuItemCards = memo(MenuItemCardsComponent);
