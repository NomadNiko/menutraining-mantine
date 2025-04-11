// src/components/menu-items/MenuItemTable.tsx
"use client";
import {
  Table,
  Group,
  Button,
  Text,
  Badge,
  Center,
  Loader,
  Image,
  Box,
  UnstyledButton,
  Flex,
  useMantineTheme,
  useMantineColorScheme,
} from "@mantine/core";
import {
  IconEdit,
  IconTrash,
  IconSortAscending,
  IconSortDescending,
} from "@tabler/icons-react";
import Link from "@/components/link";
import { useTranslation } from "@/services/i18n/client";
import { MenuItem } from "@/services/api/types/menu-item";
import { memo, useMemo, useCallback } from "react";
import { usePathname } from "next/navigation";

interface MenuItemTableProps {
  menuItems: MenuItem[];
  allergiesMap: { [key: string]: string };
  loading?: boolean;
  onDelete: (id: string, name: string) => void;
  sortField?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (field: string) => void;
}

// Define fixed column widths as constants
const COLUMN_WIDTHS = {
  image: 80,
  name: 180,
  description: 200,
  ingredients: 180,
  allergies: 180,
  actions: 160,
};

// Memoize the header component
const SortableTableHeader = memo(function SortableTableHeader({
  label,
  field,
  currentSortField,
  currentSortDirection,
  onSort,
  width,
}: {
  label: string;
  field: string;
  currentSortField?: string;
  currentSortDirection?: "asc" | "desc";
  onSort?: (field: string) => void;
  width: number;
}) {
  const isActive = currentSortField === field;
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
        data-testid={`sort-${field}`}
      >
        <Flex align="center" justify="space-between">
          <Text fw={500}>{label}</Text>
          {isActive &&
            (currentSortDirection === "asc" ? (
              <IconSortAscending size={14} />
            ) : (
              <IconSortDescending size={14} />
            ))}
        </Flex>
      </UnstyledButton>
    </th>
  );
});

// Memoize the row component for better performance
const MenuItemRow = memo(function MenuItemRow({
  menuItem,
  onDelete,
  rowColor,
  editUrl,
  t,
}: {
  menuItem: MenuItem;
  allergiesMap: { [key: string]: string };
  onDelete: (id: string, name: string) => void;
  rowColor: string;
  editUrl: string;
  t: (key: string) => string;
}) {
  return (
    <tr style={{ backgroundColor: rowColor }}>
      <td style={{ width: COLUMN_WIDTHS.image, padding: "10px" }}>
        {menuItem.menuItemUrl ? (
          <Box w={60} h={60}>
            <Image
              src={menuItem.menuItemUrl}
              alt={menuItem.menuItemName}
              height={60}
              width={60}
              fit="contain"
              radius="md"
            />
          </Box>
        ) : (
          <Text size="sm" c="dimmed">
            -
          </Text>
        )}
      </td>
      <td style={{ width: COLUMN_WIDTHS.name, padding: "10px" }}>
        <Text>{menuItem.menuItemName}</Text>
      </td>
      <td style={{ width: COLUMN_WIDTHS.description, padding: "10px" }}>
        <Text lineClamp={2}>
          {menuItem.menuItemDescription || (
            <Text size="sm" c="dimmed">
              -
            </Text>
          )}
        </Text>
      </td>
      <td style={{ width: COLUMN_WIDTHS.ingredients, padding: "10px" }}>
        <Group>
          {menuItem.ingredientNames?.length > 0 ? (
            menuItem.ingredientNames.map((name, index) => (
              <Badge key={index} size="sm">
                {name}
              </Badge>
            ))
          ) : (
            <Text size="sm" c="dimmed">
              -
            </Text>
          )}
        </Group>
      </td>
      <td style={{ width: COLUMN_WIDTHS.allergies, padding: "10px" }}>
        <Group>
          {menuItem.allergies?.length > 0 ? (
            menuItem.allergies.map((allergy) => (
              <Badge key={allergy.id} size="sm" color="red">
                {allergy.name}
              </Badge>
            ))
          ) : (
            <Text size="sm" c="dimmed">
              -
            </Text>
          )}
        </Group>
      </td>
      <td
        style={{
          width: COLUMN_WIDTHS.actions,
          textAlign: "right",
          padding: "10px",
        }}
      >
        <Group gap="xs" justify="flex-end">
          <Button
            component={Link}
            href={editUrl}
            size="xs"
            variant="light"
            leftSection={<IconEdit size={14} />}
            style={{
              width: "88px",
              height: "24px",
              padding: "0 6px",
            }}
            styles={{
              inner: {
                fontSize: "12px",
                height: "100%",
              },
            }}
          >
            <Text size="xs" truncate>
              {t("actions.edit")}
            </Text>
          </Button>
          <Button
            size="xs"
            variant="light"
            color="red"
            leftSection={<IconTrash size={14} />}
            onClick={() => onDelete(menuItem.id, menuItem.menuItemName)}
            style={{
              width: "88px",
              height: "24px",
              padding: "0 6px",
            }}
            styles={{
              inner: {
                fontSize: "12px",
                height: "100%",
              },
            }}
          >
            <Text size="xs" truncate>
              {t("actions.delete")}
            </Text>
          </Button>
        </Group>
      </td>
    </tr>
  );
});

function MenuItemTableComponent({
  menuItems,
  allergiesMap,
  loading = false,
  onDelete,
  sortField,
  sortDirection,
  onSort,
}: MenuItemTableProps) {
  const { t } = useTranslation("admin-panel-menu-items");
  const pathname = usePathname();
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();

  // Get the appropriate row colors based on the current theme
  const rowColors = useMemo(() => {
    return theme.other.tableRowColors[colorScheme];
  }, [theme.other.tableRowColors, colorScheme]);

  // Determine if we're in the restaurant or admin panel context
  const isRestaurantRoute = pathname.includes("/restaurant/");

  // Memoize the edit URL function to prevent recalculation
  const getEditUrl = useCallback(
    (menuItemId: string) => {
      return isRestaurantRoute
        ? `/restaurant/menu-items/edit/${menuItemId}`
        : `/admin-panel/menu-items/edit/${menuItemId}`;
    },
    [isRestaurantRoute]
  );

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
    <Table>
      <thead>
        <tr>
          <th style={{ width: COLUMN_WIDTHS.image, padding: "10px" }}>
            {t("table.image")}
          </th>
          <SortableTableHeader
            label={t("table.name")}
            field="menuItemName"
            currentSortField={sortField}
            currentSortDirection={sortDirection}
            onSort={onSort}
            width={COLUMN_WIDTHS.name}
          />
          <SortableTableHeader
            label={t("table.description")}
            field="menuItemDescription"
            currentSortField={sortField}
            currentSortDirection={sortDirection}
            onSort={onSort}
            width={COLUMN_WIDTHS.description}
          />
          <SortableTableHeader
            label={t("table.ingredients")}
            field="ingredients"
            currentSortField={sortField}
            currentSortDirection={sortDirection}
            onSort={onSort}
            width={COLUMN_WIDTHS.ingredients}
          />
          <SortableTableHeader
            label={t("table.allergies")}
            field="allergies"
            currentSortField={sortField}
            currentSortDirection={sortDirection}
            onSort={onSort}
            width={COLUMN_WIDTHS.allergies}
          />
          <th
            style={{
              width: COLUMN_WIDTHS.actions,
              textAlign: "right",
              padding: "10px",
            }}
          >
            {t("table.actions")}
          </th>
        </tr>
      </thead>
      <tbody>
        {menuItems.map((menuItem, index) => (
          <MenuItemRow
            key={menuItem.id}
            menuItem={menuItem}
            allergiesMap={allergiesMap}
            onDelete={onDelete}
            rowColor={index % 2 === 0 ? rowColors.even : rowColors.odd}
            editUrl={getEditUrl(menuItem.id)}
            t={t}
          />
        ))}
      </tbody>
    </Table>
  );
}

// Use React.memo to prevent unnecessary re-renders
const MenuItemTable = memo(MenuItemTableComponent);
export default MenuItemTable;
