// src/components/menus/MenuCard.tsx
"use client";
import { Card, Text, Group, Stack, Button, Badge } from "@mantine/core";
import { IconEdit, IconTrash, IconEye } from "@tabler/icons-react";
import Link from "@/components/link";
import { useTranslation } from "@/services/i18n/client";
import { Menu, DayOfWeek } from "@/services/api/types/menu";

interface MenuCardProps {
  menu: Menu;
  onDelete: (id: string, name: string) => void;
  onView: (id: string) => void;
}

export function MenuCard({ menu, onDelete, onView }: MenuCardProps) {
  const { t } = useTranslation("restaurant-menus");

  // Format days of week display
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
          <Badge color="green">
            {t("sections")}: {menu.menuSections?.length || 0}
          </Badge>
        </Group>
      </Stack>
      <Group justify="flex-end" mt="md">
        <Button
          size="compact-xs"
          variant="light"
          color="blue"
          leftSection={<IconEye size={14} />}
          onClick={() => onView(menu.id)}
        >
          {t("actions.view")}
        </Button>
        <Button
          component={Link}
          href={`/restaurant/menus/edit/${menu.id}`}
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
          onClick={() => onDelete(menu.id, menu.name)}
        >
          {t("actions.delete")}
        </Button>
      </Group>
    </Card>
  );
}
