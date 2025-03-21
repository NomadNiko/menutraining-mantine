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
} from "@mantine/core";
import { IconEdit, IconTrash } from "@tabler/icons-react";
import Link from "@/components/link";
import { useTranslation } from "@/services/i18n/client";
import { Ingredient } from "@/services/api/types/ingredient";

interface IngredientTableProps {
  ingredients: Ingredient[];
  allergies: { [key: string]: string };
  subIngredientNames: { [key: string]: string };
  loading?: boolean;
  onDelete: (id: string, name: string) => void;
}

export default function IngredientTable({
  ingredients,
  allergies,
  subIngredientNames,
  loading = false,
  onDelete,
}: IngredientTableProps) {
  const { t } = useTranslation("admin-panel-ingredients");

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
    <Table striped highlightOnHover>
      <thead>
        <tr>
          <th style={{ width: 80 }}>{t("table.image")}</th>
          <th>{t("table.name")}</th>
          <th>{t("table.allergies")}</th>
          <th>{t("table.subIngredients")}</th>
          <th style={{ textAlign: "right" }}>{t("table.actions")}</th>
        </tr>
      </thead>
      <tbody>
        {ingredients.map((ingredient) => (
          <tr key={ingredient.id}>
            <td style={{ width: 80 }}>
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
            <td>
              <Text>{ingredient.ingredientName}</Text>
            </td>
            <td>
              <Group>
                {ingredient.ingredientAllergies &&
                ingredient.ingredientAllergies.length > 0 ? (
                  ingredient.ingredientAllergies.map((allergyId: string) => (
                    <Badge key={allergyId} size="sm">
                      {allergies[allergyId] || allergyId}
                    </Badge>
                  ))
                ) : (
                  <Text size="sm" c="dimmed">
                    -
                  </Text>
                )}
              </Group>
            </td>
            <td>
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
            <td style={{ textAlign: "right" }}>
              <Group gap="xs" justify="flex-end">
                <Button
                  component={Link}
                  href={`/admin-panel/ingredients/edit/${ingredient.id}`}
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
