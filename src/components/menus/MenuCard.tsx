// src/components/menus/MenuCard.tsx
"use client";
import { Card, Text, Group, Stack, Button, Badge, Box } from "@mantine/core";
import { IconEdit, IconTrash, IconEye } from "@tabler/icons-react";
import Link from "@/components/link";
import { useTranslation } from "@/services/i18n/client";
import { Menu, DayOfWeek } from "@/services/api/types/menu";
import { useEffect, useState } from "react";
import { MenuSection } from "@/services/api/types/menu-section";
import { useGetMenuSectionService } from "@/services/api/services/menu-sections";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { useMenuCache } from "./MenuDataPreloader";

interface MenuCardProps {
  menu: Menu;
  onDelete: (id: string, name: string) => void;
  onView: (id: string) => void;
}

export function MenuCard({ menu, onDelete, onView }: MenuCardProps) {
  const { t } = useTranslation("restaurant-menus");
  const [sectionMap, setSectionMap] = useState<Record<string, MenuSection>>({});
  const getMenuSectionService = useGetMenuSectionService();
  const cache = useMenuCache();

  // Fetch section data for menu
  useEffect(() => {
    const fetchSections = async () => {
      if (!menu.menuSections || menu.menuSections.length === 0) return;

      const newSectionMap: Record<string, MenuSection> = { ...sectionMap };
      let hasChanges = false;

      for (const sectionId of menu.menuSections) {
        // Check if we already have this section
        if (newSectionMap[sectionId] || cache.sections[sectionId]) {
          if (cache.sections[sectionId] && !newSectionMap[sectionId]) {
            newSectionMap[sectionId] = cache.sections[sectionId];
            hasChanges = true;
          }
          continue;
        }

        try {
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
  }, [menu.menuSections, getMenuSectionService, sectionMap, cache.sections]);

  // Format days of week display (for mobile cards, we can simplify)
  const formatDays = (days: DayOfWeek[]) => {
    if (!days || days.length === 0) return "-";
    // If all days are selected
    if (days.length === 7) return t("days.everyday");
    // If weekdays
    const weekdays = [
      DayOfWeek.MONDAY,
      DayOfWeek.TUESDAY,
      DayOfWeek.WEDNESDAY,
      DayOfWeek.THURSDAY,
      DayOfWeek.FRIDAY,
    ];
    const isWeekdays =
      weekdays.every((day) => days.includes(day)) && days.length === 5;
    if (isWeekdays) return t("days.weekdays");
    // If weekend
    const weekend = [DayOfWeek.SATURDAY, DayOfWeek.SUNDAY];
    const isWeekend =
      weekend.every((day) => days.includes(day)) && days.length === 2;
    if (isWeekend) return t("days.weekend");
    // Otherwise, list the days
    return days.map((day) => t(`days.short.${day}`)).join(", ");
  };

  // Helper function to generate section name list
  const getSectionsDisplay = () => {
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
    <Card shadow="sm" p="md" radius="md" withBorder mb="sm">
      <Stack gap="xs">
        <Text size="lg" fw={500}>
          {menu.name}
        </Text>
        {menu.description && (
          <Text size="sm" lineClamp={3}>
            {menu.description}
          </Text>
        )}
        <Group gap="md">
          <Badge color="gray">
            {t("days.available")}: {formatDays(menu.activeDays)}
          </Badge>
          {menu.startTime && menu.endTime && (
            <Badge color="blue">
              {menu.startTime} - {menu.endTime}
            </Badge>
          )}
        </Group>
        <Box>
          <Text size="sm" fw={500} mb="xs">
            {t("sections")}:
          </Text>
          {getSectionsDisplay()}
        </Box>
      </Stack>
      <Group justify="flex-end" mt="md">
        <Button
          size="compact-xs"
          variant="light"
          color="blue"
          leftSection={<IconEye size={14} />}
          onClick={() => onView(menu.menuId)}
        >
          {t("actions.view")}
        </Button>
        <Button
          component={Link}
          href={`/restaurant/menus/edit/${menu.menuId}`}
          size="compact-xs"
          variant="light"
          leftSection={<IconEdit size={14} />}
        >
          {t("actions.edit")}
        </Button>
        <Button
          size="compact-xs"
          variant="light"
          color="red"
          leftSection={<IconTrash size={14} />}
          onClick={() => onDelete(menu.menuId, menu.name)}
        >
          {t("actions.delete")}
        </Button>
      </Group>
    </Card>
  );
}
