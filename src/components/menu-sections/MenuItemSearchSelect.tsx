// src/components/menu-sections/MenuItemSearchSelect.tsx
"use client";
import { useEffect, useState } from "react";
import { Select, Loader } from "@mantine/core";
import { useGetMenuItemsService } from "@/services/api/services/menu-items";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { useTranslation } from "@/services/i18n/client";
import { MenuItem } from "@/services/api/types/menu-item";

interface MenuItemSearchSelectProps {
  restaurantId: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export function MenuItemSearchSelect({
  restaurantId,
  value,
  onChange,
  error,
  disabled = false,
}: MenuItemSearchSelectProps) {
  const { t } = useTranslation("restaurant-menu-sections");
  const [loading, setLoading] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const getMenuItemsService = useGetMenuItemsService();

  // Initial load of menu items
  useEffect(() => {
    const fetchMenuItems = async () => {
      if (!restaurantId) return;

      setLoading(true);
      try {
        const { status, data } = await getMenuItemsService(undefined, {
          restaurantId,
          limit: 50,
        });

        if (status === HTTP_CODES_ENUM.OK) {
          const menuItemsData = Array.isArray(data) ? data : data?.data || [];
          setMenuItems(menuItemsData);
        }
      } catch (error) {
        console.error("Error fetching menu items:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMenuItems();
  }, [restaurantId, getMenuItemsService]);

  // Search menu items
  const handleSearch = async (query: string) => {
    setSearchValue(query);

    if (query.length < 2 || !restaurantId) return;

    setLoading(true);
    try {
      const { status, data } = await getMenuItemsService(undefined, {
        restaurantId,
        limit: 20,
      });

      if (status === HTTP_CODES_ENUM.OK) {
        const menuItemsData = Array.isArray(data) ? data : data?.data || [];
        // Filter client-side by name
        const filtered = menuItemsData.filter((item) =>
          item.menuItemName.toLowerCase().includes(query.toLowerCase())
        );
        setMenuItems(filtered);
      }
    } catch (error) {
      console.error("Error searching menu items:", error);
    } finally {
      setLoading(false);
    }
  };

  // Format data for the Select component
  const selectData = menuItems.map((item) => ({
    value: item.id,
    label: item.menuItemName,
  }));

  return (
    <Select
      label={t("form.menuItem")}
      placeholder={t("form.searchMenuItems")}
      data={selectData}
      value={value}
      onChange={(value: string | null) => {
        if (value !== null) {
          onChange(value);
        }
      }}
      searchable
      clearable
      onSearchChange={handleSearch}
      searchValue={searchValue}
      rightSection={loading ? <Loader size="xs" /> : null}
      error={error}
      disabled={disabled}
      required
    />
  );
}
