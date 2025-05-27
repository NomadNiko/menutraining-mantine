// src/components/menus/MenuTable.tsx
"use client";
import {
  Table,
  Group,
  Button,
  Text,
  Center,
  Loader,
  UnstyledButton,
  Flex,
  Badge,
} from "@mantine/core";
import {
  IconEdit,
  IconTrash,
  IconSortAscending,
  IconSortDescending,
  IconEye,
} from "@tabler/icons-react";
import Link from "@/components/link";
import { useTranslation } from "@/services/i18n/client";
import { Menu, DayOfWeek } from "@/services/api/types/menu";
import { memo } from "react";
import { useGetMenuSectionService } from "@/services/api/services/menu-sections";
import { useState, useEffect } from "react";
import { MenuSection } from "@/services/api/types/menu-section";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { useMenuCache } from "./MenuDataPreloader";

interface MenuTableProps {
  menus: Menu[];
  loading?: boolean;
  onDelete: (id: string, name: string) => void;
  onView: (id: string) => void;
  sortField?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (field: string) => void;
}

function MenuTableComponent({
  menus,
  loading = false,
  onDelete,
  onView,
  sortField,
  sortDirection,
  onSort,
}: MenuTableProps) {
  const { t } = useTranslation("restaurant-menus");
  const getMenuSectionService = useGetMenuSectionService();
  const [sectionMap, setSectionMap] = useState<Record<string, MenuSection>>({});
  const cache = useMenuCache();

  // Fetch and cache section data for all menus
  useEffect(() => {
    if (!menus.length) return;
    const fetchSections = async () => {
      const newSectionMap: Record<string, MenuSection> = { ...sectionMap };
      let hasChanges = false;
      // Get all unique section IDs from all menus
      const sectionIds = new Set<string>();
      menus.forEach((menu) => {
        if (menu.menuSections) {
          menu.menuSections.forEach((id) => sectionIds.add(id));
        }
      });
      // Fetch missing sections
      for (const sectionId of Array.from(sectionIds)) {
        // Check if we already have this section
        if (newSectionMap[sectionId] || cache.sections[sectionId]) {
          if (cache.sections[sectionId] && !newSectionMap[sectionId]) {
            newSectionMap[sectionId] = cache.sections[sectionId];
            hasChanges = true;
          }
          continue;
        }
        try {
          // Corrected: Use getMenuSectionService with proper parameter format
          const response = await getMenuSectionService({
            menuSectionId: sectionId,
          });
          if (response.status === HTTP_CODES_ENUM.OK) {
            newSectionMap[sectionId] = response.data;
            cache.sections[sectionId] = response.data;
            hasChanges = true;
          }
        } catch (error) {
          console.error(`Error fetching section ${sectionId}:`, error);
        }
      }
      if (hasChanges) {
        setSectionMap(newSectionMap);
      }
    };
    fetchSections();
  }, [menus, getMenuSectionService, sectionMap, cache.sections]);

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

  const SortableHeader = ({
    label,
    field,
    width,
  }: {
    label: string;
    field: string;
    width: number;
  }) => {
    const isActive = sortField === field;
    return (
      <th style={{ width, padding: "10px" }}>
        <UnstyledButton
          onClick={() => onSort && onSort(field)}
          style={{
            display: "flex",
            alignItems: "center",
            cursor: onSort ? "pointer" : "default",
            width: "100%",
          }}
        >
          <Flex align="center" justify="space-between">
            <Text fw={500}>{label}</Text>
            {isActive &&
              (sortDirection === "asc" ? (
                <IconSortAscending size={14} />
              ) : (
                <IconSortDescending size={14} />
              ))}
          </Flex>
        </UnstyledButton>
      </th>
    );
  };

  // Format days of week display for full table view - show individual day badges
  const formatDayBadges = (days: DayOfWeek[]) => {
    if (!days || days.length === 0) {
      return (
        <Text size="sm" c="dimmed">
          -
        </Text>
      );
    }

    return (
      <Group wrap="wrap" gap="xs">
        {days.map((day) => (
          <Badge key={day} size="sm" color="blue">
            {t(`days.short.${day}`)}
          </Badge>
        ))}
      </Group>
    );
  };

  // Helper function to generate section name list
  const getSectionsDisplay = (menu: Menu) => {
    if (!menu.menuSections || menu.menuSections.length === 0) {
      return (
        <Text size="sm" c="dimmed">
          -
        </Text>
      );
    }
    // Show only first 3 section names with a "+X more" if there are more than 3
    const sectionsToShow = menu.menuSections.slice(0, 3);
    const hasMoreSections = menu.menuSections.length > 3;
    return (
      <Group wrap="wrap" gap="xs">
        {sectionsToShow.map((sectionId) => {
          const section = sectionMap[sectionId];
          return (
            <Badge key={sectionId} size="sm" color="green">
              {section ? section.title : "..."}
            </Badge>
          );
        })}
        {hasMoreSections && (
          <Badge size="sm" color="gray">
            +{menu.menuSections.length - 3} {t("table.more")}
          </Badge>
        )}
      </Group>
    );
  };

  return (
    <Table>
      <thead>
        <tr>
          <SortableHeader label={t("table.name")} field="name" width={250} />
          <th style={{ width: 150, padding: "10px" }}>{t("table.days")}</th>
          <th style={{ width: 150, padding: "10px" }}>
            {t("table.timeRange")}
          </th>
          <th style={{ width: 300, padding: "10px" }}>{t("table.sections")}</th>
          <th style={{ width: 250, textAlign: "right", padding: "10px" }}>
            {t("table.actions")}
          </th>
        </tr>
      </thead>
      <tbody>
        {menus.map((menu) => (
          <tr key={menu.menuId}>
            <td style={{ width: 250, padding: "10px" }}>
              <Text fw={500}>{menu.name}</Text>
            </td>
            <td style={{ width: 150, padding: "10px" }}>
              {formatDayBadges(menu.activeDays)}
            </td>
            <td style={{ width: 150, padding: "10px" }}>
              {menu.startTime && menu.endTime ? (
                <Badge color="blue">
                  {menu.startTime} - {menu.endTime}
                </Badge>
              ) : (
                <Text size="sm" c="dimmed">
                  -
                </Text>
              )}
            </td>
            <td style={{ width: 300, padding: "10px" }}>
              {getSectionsDisplay(menu)}
            </td>
            <td
              style={{
                width: 250,
                textAlign: "right",
                padding: "10px",
              }}
            >
              <Group gap="xs" justify="flex-end">
                <Button
                  onClick={() => onView(menu.menuId)}
                  size="xs"
                  variant="light"
                  color="blue"
                  leftSection={<IconEye size={14} />}
                >
                  {t("actions.view")}
                </Button>
                <Button
                  component={Link}
                  href={`/restaurant/menus/edit/${menu.menuId}`}
                  size="xs"
                  variant="light"
                  leftSection={<IconEdit size={14} />}
                >
                  {t("actions.edit")}
                </Button>
                <Button
                  size="xs"
                  variant="light"
                  color="red"
                  leftSection={<IconTrash size={14} />}
                  onClick={() => onDelete(menu.menuId, menu.name)}
                >
                  {t("actions.delete")}
                </Button>
              </Group>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

// Use memo to prevent unnecessary re-renders
export const MenuTable = memo(MenuTableComponent);
