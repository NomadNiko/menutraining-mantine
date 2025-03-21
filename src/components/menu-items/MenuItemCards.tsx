"use client";
import { useEffect, useRef } from "react";
import { Stack, Center, Loader, Text } from "@mantine/core";
import { MenuItemCard } from "./MenuItemCard";
import { useTranslation } from "@/services/i18n/client";
import { MenuItem } from "@/services/api/types/menu-item";

interface MenuItemCardsProps {
  menuItems: MenuItem[];
  ingredients: { [key: string]: string };
  getMenuItemAllergies: (menuItem: MenuItem) => { id: string; name: string }[];
  handleLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
  onDelete: (id: string, name: string) => void;
}

export function MenuItemCards({
  menuItems,
  ingredients,
  getMenuItemAllergies,
  handleLoadMore,
  hasMore = false,
  loading = false,
  onDelete,
}: MenuItemCardsProps) {
  const { t } = useTranslation("admin-panel-menu-items");
  const observerTarget = useRef<HTMLDivElement>(null);

  // Set up intersection observer for infinite scrolling
  useEffect(() => {
    const currentTarget = observerTarget.current;
    if (!currentTarget || !hasMore || loading || !handleLoadMore) return;

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
      {menuItems.map((menuItem) => (
        <MenuItemCard
          key={menuItem.id}
          menuItem={menuItem}
          ingredients={ingredients}
          getMenuItemAllergies={getMenuItemAllergies}
          onDelete={onDelete}
        />
      ))}

      {loading && hasMore && (
        <Center p="md">
          <Loader size="sm" />
        </Center>
      )}

      <div ref={observerTarget} style={{ height: 10 }}></div>
    </Stack>
  );
}
