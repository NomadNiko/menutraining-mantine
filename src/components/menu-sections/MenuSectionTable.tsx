// src/components/menu-sections/MenuSectionTable.tsx
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
import { MenuSection } from "@/services/api/types/menu-section";
import { memo } from "react";

interface MenuSectionTableProps {
  menuSections: MenuSection[];
  loading?: boolean;
  onDelete: (id: string, title: string) => void;
  onView?: (id: string) => void;
  sortField?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (field: string) => void;
}

function MenuSectionTableComponent({
  menuSections,
  loading = false,
  onDelete,
  onView,
  sortField,
  sortDirection,
  onSort,
}: MenuSectionTableProps) {
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

  return (
    <Table>
      <thead>
        <tr>
          <SortableHeader label={t("table.title")} field="title" width={200} />
          <th style={{ width: 200, padding: "10px" }}>
            {t("table.description")}
          </th>
          <th style={{ width: 150, padding: "10px" }}>
            {t("table.timeRange")}
          </th>
          <th style={{ width: 100, padding: "10px" }}>
            {t("table.itemCount")}
          </th>
          <th style={{ width: 200, textAlign: "right", padding: "10px" }}>
            {t("table.actions")}
          </th>
        </tr>
      </thead>
      <tbody>
        {menuSections.map((section) => (
          <tr key={section.id}>
            <td style={{ width: 200, padding: "10px" }}>
              <Text fw={500}>{section.title}</Text>
            </td>
            <td style={{ width: 200, padding: "10px" }}>
              <Text lineClamp={2}>
                {section.description || (
                  <Text size="sm" c="dimmed">
                    -
                  </Text>
                )}
              </Text>
            </td>
            <td style={{ width: 150, padding: "10px" }}>
              {section.startTime && section.endTime ? (
                <Badge>
                  {section.startTime} - {section.endTime}
                </Badge>
              ) : (
                <Text size="sm" c="dimmed">
                  -
                </Text>
              )}
            </td>
            <td style={{ width: 100, padding: "10px" }}>
              <Badge color="blue">{section.items?.length || 0}</Badge>
            </td>
            <td
              style={{
                width: 200,
                textAlign: "right",
                padding: "10px",
              }}
            >
              <Group gap="xs" justify="flex-end">
                {onView && (
                  <ActionIcon
                    onClick={() => onView(section.id)}
                    size="sm"
                    variant="light"
                    color="blue"
                  >
                    <IconEye size={16} />
                  </ActionIcon>
                )}
                <Button
                  component={Link}
                  href={`/restaurant/menu-sections/edit/${section.id}`}
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
                  onClick={() => onDelete(section.id, section.title)}
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
export const MenuSectionTable = memo(MenuSectionTableComponent);
