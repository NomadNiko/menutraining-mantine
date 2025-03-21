"use client";
import {
  Card,
  Text,
  Group,
  Stack,
  Button,
  Badge,
  Image,
  Box,
} from "@mantine/core";
import { IconEdit, IconTrash } from "@tabler/icons-react";
import Link from "@/components/link";
import { useTranslation } from "@/services/i18n/client";

interface IngredientCardProps {
  ingredient: {
    id: string;
    ingredientId: string;
    ingredientName: string;
    ingredientAllergies: string[];
    ingredientImageUrl?: string | null;
    subIngredients: string[];
  };
  allergies: { [key: string]: string };
  subIngredientNames: { [key: string]: string };
  onDelete: (id: string, name: string) => void;
}

export function IngredientCard({
  ingredient,
  allergies,
  subIngredientNames,
  onDelete,
}: IngredientCardProps) {
  const { t } = useTranslation("admin-panel-ingredients");
  return (
    <Card shadow="sm" p="md" radius="md" withBorder mb="sm">
      <Stack gap="xs">
        <Group align="flex-start">
          {ingredient.ingredientImageUrl && (
            <Box w={80}>
              <Image
                src={ingredient.ingredientImageUrl}
                alt={ingredient.ingredientName}
                fit="contain"
                height={80}
                width={80}
                radius="md"
              />
            </Box>
          )}
          <Box>
            <Text size="lg" fw={500}>
              {ingredient.ingredientName}
            </Text>
          </Box>
        </Group>

        {ingredient.ingredientAllergies &&
          ingredient.ingredientAllergies.length > 0 && (
            <Stack gap="xs">
              <Text size="sm" fw={500} c="dimmed">
                {t("table.allergies")}:
              </Text>
              <Group gap="xs">
                {ingredient.ingredientAllergies.map((allergyId) => (
                  <Badge key={allergyId} size="sm">
                    {allergies[allergyId] || allergyId}
                  </Badge>
                ))}
              </Group>
            </Stack>
          )}
        {ingredient.subIngredients && ingredient.subIngredients.length > 0 && (
          <Stack gap="xs">
            <Text size="sm" fw={500} c="dimmed">
              {t("table.subIngredients")}:
            </Text>
            <Group gap="xs">
              {ingredient.subIngredients.map((ingredientId) => (
                <Badge key={ingredientId} size="sm" color="blue">
                  {subIngredientNames[ingredientId] || ingredientId}
                </Badge>
              ))}
            </Group>
          </Stack>
        )}
      </Stack>
      <Group justify="flex-end" mt="md">
        <Button
          component={Link}
          href={`/admin-panel/ingredients/edit/${ingredient.id}`}
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
          onClick={() => onDelete(ingredient.id, ingredient.ingredientName)}
        >
          {t("actions.delete")}
        </Button>
      </Group>
    </Card>
  );
}
