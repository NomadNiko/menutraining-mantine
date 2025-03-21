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
import { MenuItem } from "@/services/api/types/menu-item";

interface MenuItemCardProps {
  menuItem: MenuItem;
  onDelete: (id: string, name: string) => void;
}

export function MenuItemCard({ menuItem, onDelete }: MenuItemCardProps) {
  const { t } = useTranslation("admin-panel-menu-items");

  return (
    <Card shadow="sm" p="md" radius="md" withBorder mb="sm">
      <Stack gap="xs">
        <Group align="flex-start">
          {menuItem.menuItemUrl && (
            <Box w={80}>
              <Image
                src={menuItem.menuItemUrl}
                alt={menuItem.menuItemName}
                fit="contain"
                height={80}
                width={80}
                radius="md"
              />
            </Box>
          )}
          <Box>
            <Text size="lg" fw={500}>
              {menuItem.menuItemName}
            </Text>
          </Box>
        </Group>
        {menuItem.menuItemDescription && (
          <Text size="sm" lineClamp={3}>
            {menuItem.menuItemDescription}
          </Text>
        )}
        {menuItem.ingredientNames?.length > 0 && (
          <Stack gap="xs">
            <Text size="sm" fw={500} c="dimmed">
              {t("table.ingredients")}:
            </Text>
            <Group gap="xs">
              {menuItem.ingredientNames.map((name, index) => (
                <Badge key={index} size="sm">
                  {name}
                </Badge>
              ))}
            </Group>
          </Stack>
        )}
        {menuItem.allergies?.length > 0 && (
          <Stack gap="xs">
            <Text size="sm" fw={500} c="dimmed">
              {t("table.allergies")}:
            </Text>
            <Group gap="xs">
              {menuItem.allergies.map((allergy) => (
                <Badge key={allergy.id} size="sm" color="red">
                  {allergy.name}
                </Badge>
              ))}
            </Group>
          </Stack>
        )}
      </Stack>
      <Group justify="flex-end" mt="md">
        <Button
          component={Link}
          href={`/admin-panel/menu-items/edit/${menuItem.id}`}
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
          onClick={() => onDelete(menuItem.id, menuItem.menuItemName)}
        >
          {t("actions.delete")}
        </Button>
      </Group>
    </Card>
  );
}
