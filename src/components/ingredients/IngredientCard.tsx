// src/components/ingredients/IngredientCard.tsx
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
  Flex,
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
    derivedAllergies?: string[];
    categories: string[];
    subIngredientDetails?: Array<{ id: string; name: string }>;
  };
  allergies: { [key: string]: string };
  onDelete: (id: string, name: string) => void;
}
export function IngredientCard({
  ingredient,
  allergies,
  onDelete,
}: IngredientCardProps) {
  const { t } = useTranslation("admin-panel-ingredients");
  return (
    <Card shadow="sm" p="md" radius="md" withBorder mb="sm">
      <Stack gap="xs">
        <Flex align="flex-start">
          {ingredient.ingredientImageUrl && (
            <Box mr="md" w={80} miw={80}>
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
          <Box style={{ flex: 1 }}>
            <Text size="lg" fw={500}>
              {ingredient.ingredientName}
            </Text>
          </Box>
        </Flex>
        {/* Categories */}
        <Stack gap="xs">
          <Text size="sm" fw={500} c="dimmed">
            {t("table.categories")}:
          </Text>
          <Group gap="xs">
            {ingredient.categories && ingredient.categories.length > 0 ? (
              ingredient.categories.map((categoryKey) => (
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
        </Stack>
        {/* Direct allergies */}
        {ingredient.ingredientAllergies &&
          ingredient.ingredientAllergies.length > 0 && (
            <Stack gap="xs">
              <Text size="sm" fw={500} c="dimmed">
                {t("table.allergies")}:
              </Text>
              <Group gap="xs">
                {ingredient.ingredientAllergies.map((allergyId) => (
                  <Badge key={allergyId} size="sm" color="red" variant="filled">
                    {allergies[allergyId] || allergyId}
                  </Badge>
                ))}
              </Group>
            </Stack>
          )}
        {/* Derived allergies */}
        {ingredient.derivedAllergies &&
          ingredient.derivedAllergies.length > 0 && (
            <Stack gap="xs">
              <Text size="sm" fw={500} c="dimmed">
                {t("table.derivedAllergies")}:
              </Text>
              <Group gap="xs">
                {ingredient.derivedAllergies.map((allergyId) => (
                  <Badge
                    key={allergyId}
                    size="sm"
                    color="red"
                    variant="outline"
                  >
                    {allergies[allergyId] || allergyId}
                  </Badge>
                ))}
              </Group>
            </Stack>
          )}
        {/* Sub-ingredients */}
        {ingredient.subIngredientDetails &&
          ingredient.subIngredientDetails.length > 0 && (
            <Stack gap="xs">
              <Text size="sm" fw={500} c="dimmed">
                {t("table.subIngredients")}:
              </Text>
              <Group gap="xs">
                {ingredient.subIngredientDetails.map((subIngredient) => (
                  <Badge key={subIngredient.id} size="sm" color="blue">
                    {subIngredient.name}
                  </Badge>
                ))}
              </Group>
            </Stack>
          )}
      </Stack>
      <Group justify="flex-end" mt="md">
        <Button
          component={Link}
          href={`/restaurant/ingredients/edit/${ingredient.id}`}
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
