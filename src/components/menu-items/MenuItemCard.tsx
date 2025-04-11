// src/components/menu-items/MenuItemCard.tsx
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
import { MenuItem } from "@/services/api/types/menu-item";
import { usePathname } from "next/navigation";
interface MenuItemCardProps {
  menuItem: MenuItem;
  allergiesMap: { [key: string]: string };
  onDelete: (id: string, name: string) => void;
}
export function MenuItemCard({ menuItem, onDelete }: MenuItemCardProps) {
  const { t } = useTranslation("admin-panel-menu-items");
  const pathname = usePathname();
  const isRestaurantRoute = pathname.includes("/restaurant/");
  const editUrl = isRestaurantRoute
    ? `/restaurant/menu-items/edit/${menuItem.id}`
    : `/admin-panel/menu-items/edit/${menuItem.id}`;
  return (
    <Card shadow="sm" p="md" radius="md" withBorder mb="sm">
      <Stack gap="xs">
        <Flex align="flex-start">
          {menuItem.menuItemUrl && (
            <Box mr="md" w={80} miw={80}>
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
          <Box style={{ flex: 1 }}>
            <Text size="lg" fw={500}>
              {menuItem.menuItemName}
            </Text>
          </Box>
        </Flex>
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
            <Group gap="xs" wrap="wrap">
              {menuItem.ingredientNames.map((name, index) => (
                <Badge
                  key={index}
                  size="sm"
                  styles={{
                    root: {
                      maxWidth: "100%",
                      whiteSpace: "normal",
                      wordBreak: "break-word",
                      lineHeight: 1.2,
                      height: "auto",
                      padding: "3px 8px",
                    },
                  }}
                >
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
            <Group gap="xs" wrap="wrap">
              {menuItem.allergies.map((allergy) => (
                <Badge
                  key={allergy.id}
                  size="sm"
                  color="red"
                  styles={{
                    root: {
                      whiteSpace: "normal",
                      wordBreak: "break-word",
                      lineHeight: 1.2,
                      height: "auto",
                      padding: "3px 8px",
                    },
                  }}
                >
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
          href={editUrl}
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
