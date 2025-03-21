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
import { MenuItem } from "@/services/api/types/menu-item";

interface MenuItemTableProps {
  menuItems: MenuItem[];
  ingredients: { [key: string]: string };
  getMenuItemAllergies: (menuItem: MenuItem) => { id: string; name: string }[];
  loading?: boolean;
  onDelete: (id: string, name: string) => void;
}

export default function MenuItemTable({
  menuItems,
  ingredients,
  getMenuItemAllergies,
  loading = false,
  onDelete,
}: MenuItemTableProps) {
  const { t } = useTranslation("admin-panel-menu-items");

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
    <Table striped highlightOnHover>
      <thead>
        <tr>
          <th style={{ width: 80 }}>{t("table.image")}</th>
          <th>{t("table.name")}</th>
          <th>{t("table.description")}</th>
          <th>{t("table.ingredients")}</th>
          <th>{t("table.allergies")}</th>
          <th style={{ textAlign: "right" }}>{t("table.actions")}</th>
        </tr>
      </thead>
      <tbody>
        {menuItems.map((menuItem) => {
          // Get allergies for this menu item
          const allergies = getMenuItemAllergies(menuItem);

          return (
            <tr key={menuItem.id}>
              <td style={{ width: 80 }}>
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
              <td>
                <Text>{menuItem.menuItemName}</Text>
              </td>
              <td>
                <Text lineClamp={2}>
                  {menuItem.menuItemDescription || (
                    <Text size="sm" c="dimmed">
                      -
                    </Text>
                  )}
                </Text>
              </td>
              <td>
                <Group>
                  {menuItem.menuItemIngredients?.length > 0 ? (
                    menuItem.menuItemIngredients.map((ingredientId) => (
                      <Badge key={ingredientId} size="sm">
                        {ingredients[ingredientId] || ingredientId}
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
                  {allergies.length > 0 ? (
                    allergies.map((allergy) => (
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
              <td style={{ textAlign: "right" }}>
                <Group gap="xs" justify="flex-end">
                  <Button
                    component={Link}
                    href={`/admin-panel/menu-items/edit/${menuItem.id}`}
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
        })}
      </tbody>
    </Table>
  );
}
