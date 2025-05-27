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

  // Helper function to generate item name list
  const getItemsDisplay = (section: MenuSection) => {
    if (!section.items || section.items.length === 0) {
      return (
        <Text size="sm" c="dimmed">
          -
        </Text>
      );
    }

    // Show only first 3 item names with a "+X more" if there are more than 3
    const itemsToShow = section.items.slice(0, 3);
    const hasMoreItems = section.items.length > 3;

    return (
      <Group wrap="wrap" gap="xs">
        {itemsToShow.map((item, index) => (
          <Badge key={index} size="sm" color="blue">
            {item.name}
          </Badge>
        ))}
        {hasMoreItems && (
          <Badge size="sm" color="gray">
            +{section.items.length - 3} {t("table.more")}
          </Badge>
        )}
      </Group>
    );
  };

  return (
    <Table>
      <thead>
        <tr>
          <SortableHeader label={t("table.title")} field="title" width={250} />
          <th style={{ width: 150, padding: "10px" }}>
            {t("table.timeRange")}
          </th>
          <th style={{ width: 300, padding: "10px" }}>{t("table.items")}</th>
          <th style={{ width: 250, textAlign: "right", padding: "10px" }}>
            {t("table.actions")}
          </th>
        </tr>
      </thead>
      <tbody>
        {menuSections.map((section) => (
          <tr key={section.menuSectionId}>
            <td style={{ width: 250, padding: "10px" }}>
              <Text fw={500}>{section.title}</Text>
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
            <td style={{ width: 300, padding: "10px" }}>
              {getItemsDisplay(section)}
            </td>
            <td
              style={{
                width: 250,
                textAlign: "right",
                padding: "10px",
              }}
            >
              <Group gap="xs" justify="flex-end">
                {onView && (
                  <Button
                    onClick={() => onView(section.menuSectionId)}
                    size="xs"
                    variant="light"
                    color="blue"
                    leftSection={<IconEye size={14} />}
                  >
                    {t("actions.view")}
                  </Button>
                )}
                <Button
                  component={Link}
                  href={`/restaurant/menu-sections/edit/${section.menuSectionId}`}
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
                  onClick={() => onDelete(section.menuSectionId, section.title)}
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
