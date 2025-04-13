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
  ActionIcon,
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
    <Table>
      <thead>
        <tr>
          <SortableHeader label={t("table.name")} field="name" width={200} />
          <th style={{ width: 200, padding: "10px" }}>
            {t("table.description")}
          </th>
          <th style={{ width: 150, padding: "10px" }}>{t("table.days")}</th>
          <th style={{ width: 150, padding: "10px" }}>
            {t("table.timeRange")}
          </th>
          <th style={{ width: 100, padding: "10px" }}>{t("table.sections")}</th>
          <th style={{ width: 200, textAlign: "right", padding: "10px" }}>
            {t("table.actions")}
          </th>
        </tr>
      </thead>
      <tbody>
        {menus.map((menu) => (
          <tr key={menu.id}>
            <td style={{ width: 200, padding: "10px" }}>
              <Text fw={500}>{menu.name}</Text>
            </td>
            <td style={{ width: 200, padding: "10px" }}>
              <Text lineClamp={2}>
                {menu.description || (
                  <Text size="sm" c="dimmed">
                    -
                  </Text>
                )}
              </Text>
            </td>
            <td style={{ width: 150, padding: "10px" }}>
              <Badge>{formatDays(menu.activeDays)}</Badge>
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
            <td style={{ width: 100, padding: "10px" }}>
              <Badge color="green">{menu.menuSections?.length || 0}</Badge>
            </td>
            <td
              style={{
                width: 200,
                textAlign: "right",
                padding: "10px",
              }}
            >
              <Group gap="xs" justify="flex-end">
                <ActionIcon
                  onClick={() => onView(menu.id)}
                  size="sm"
                  variant="light"
                  color="blue"
                  title={t("actions.view")}
                >
                  <IconEye size={16} />
                </ActionIcon>
                <Button
                  component={Link}
                  href={`/restaurant/menus/edit/${menu.id}`}
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
                  onClick={() => onDelete(menu.id, menu.name)}
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
