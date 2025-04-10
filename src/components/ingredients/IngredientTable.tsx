// src/components/ingredients/IngredientTable.tsx
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
import { Ingredient } from "@/services/api/types/ingredient";
import { memo } from "react";
import { usePathname } from "next/navigation";

interface IngredientTableProps {
  ingredients: Ingredient[];
  allergies: { [key: string]: string };
  subIngredientNames: { [key: string]: string };
  loading?: boolean;
  onDelete: (id: string, name: string) => void;
  sortField?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (field: string) => void;
}

// Define fixed column widths as constants
const COLUMN_WIDTHS = {
  image: 80,
  name: 200,
  categories: 180,
  allergies: 180,
  subIngredients: 180,
  actions: 200,
};

function SortableTableHeader({
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
}

function IngredientTableComponent({
  ingredients,
  allergies,
  subIngredientNames,
  loading = false,
  onDelete,
  sortField,
  sortDirection,
  onSort,
}: IngredientTableProps) {
  const { t } = useTranslation("admin-panel-ingredients");
  const pathname = usePathname();
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();

  // Get the appropriate row colors based on the current theme
  const rowColors = theme.other.tableRowColors?.[colorScheme] || {
    even: colorScheme === "dark" ? "#25262b" : "#ffffff",
    odd: colorScheme === "dark" ? "#2c2e33" : "#f8f9fa",
  };

  // Determine if we're in the restaurant or admin panel context
  const isRestaurantRoute = pathname.includes("/restaurant/");

  // Build the correct edit URL based on the current context
  const getEditUrl = (ingredientId: string) => {
    return isRestaurantRoute
      ? `/restaurant/ingredients/edit/${ingredientId}`
      : `/admin-panel/ingredients/edit/${ingredientId}`;
  };

  if (ingredients.length === 0 && loading) {
    return (
      <Center p="xl">
        <Loader size="md" />
      </Center>
    );
  }

  if (ingredients.length === 0) {
    return (
      <Center p="xl">
        <Text>{t("noIngredients")}</Text>
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
            field="ingredientName"
            currentSortField={sortField}
            currentSortDirection={sortDirection}
            onSort={onSort}
            width={COLUMN_WIDTHS.name}
          />
          <SortableTableHeader
            label={t("table.categories")}
            field="categories"
            currentSortField={sortField}
            currentSortDirection={sortDirection}
            onSort={onSort}
            width={COLUMN_WIDTHS.categories}
          />
          <SortableTableHeader
            label={t("table.allergies")}
            field="allergies"
            currentSortField={sortField}
            currentSortDirection={sortDirection}
            onSort={onSort}
            width={COLUMN_WIDTHS.allergies}
          />
          <SortableTableHeader
            label={t("table.subIngredients")}
            field="subIngredients"
            currentSortField={sortField}
            currentSortDirection={sortDirection}
            onSort={onSort}
            width={COLUMN_WIDTHS.subIngredients}
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
        {ingredients.map((ingredient, index) => (
          <tr
            key={ingredient.id}
            style={{
              backgroundColor: index % 2 === 0 ? rowColors.even : rowColors.odd,
            }}
          >
            <td style={{ width: COLUMN_WIDTHS.image, padding: "10px" }}>
              {ingredient.ingredientImageUrl ? (
                <Box w={60} h={60}>
                  <Image
                    src={ingredient.ingredientImageUrl}
                    alt={ingredient.ingredientName}
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
              <Text>{ingredient.ingredientName}</Text>
            </td>
            <td style={{ width: COLUMN_WIDTHS.categories, padding: "10px" }}>
              <Group>
                {ingredient.categories && ingredient.categories.length > 0 ? (
                  ingredient.categories.map((categoryKey: string) => (
                    <Badge key={categoryKey} size="sm" color="green">
                      {t(`categories.${categoryKey}`)}
                    </Badge>
                  ))
                ) : (
                  <Badge size="sm" color="green">
                    {t("categories.basic")}
                  </Badge>
                )}
              </Group>
            </td>
            <td style={{ width: COLUMN_WIDTHS.allergies, padding: "10px" }}>
              <Group>
                {/* Direct allergies */}
                {ingredient.ingredientAllergies &&
                ingredient.ingredientAllergies.length > 0
                  ? ingredient.ingredientAllergies.map((allergyId: string) => (
                      <Badge
                        key={allergyId}
                        size="sm"
                        color="red"
                        variant="filled"
                      >
                        {allergies[allergyId] || allergyId}
                      </Badge>
                    ))
                  : null}
                {/* Derived allergies */}
                {ingredient.derivedAllergies &&
                ingredient.derivedAllergies.length > 0
                  ? ingredient.derivedAllergies.map((allergyId: string) => (
                      <Badge
                        key={`derived-${allergyId}`}
                        size="sm"
                        color="red"
                        variant="outline"
                      >
                        {allergies[allergyId] || allergyId}
                      </Badge>
                    ))
                  : null}
                {/* Show message if no allergies at all */}
                {(!ingredient.ingredientAllergies ||
                  ingredient.ingredientAllergies.length === 0) &&
                  (!ingredient.derivedAllergies ||
                    ingredient.derivedAllergies.length === 0) && (
                    <Text size="sm" c="dimmed">
                      -
                    </Text>
                  )}
              </Group>
            </td>
            <td
              style={{ width: COLUMN_WIDTHS.subIngredients, padding: "10px" }}
            >
              <Group>
                {ingredient.subIngredients &&
                ingredient.subIngredients.length > 0 ? (
                  ingredient.subIngredients.map((ingredientId: string) => (
                    <Badge key={ingredientId} size="sm" color="blue">
                      {subIngredientNames[ingredientId] || ingredientId}
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
                  href={getEditUrl(ingredient.id)}
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
                  onClick={() =>
                    onDelete(ingredient.id, ingredient.ingredientName)
                  }
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
        ))}
      </tbody>
    </Table>
  );
}

// Memoize the component to prevent unnecessary re-renders
const IngredientTable = memo(IngredientTableComponent);
export default IngredientTable;
