"use client";
import { RoleEnum } from "@/services/api/types/role";
import { useTranslation } from "@/services/i18n/client";
import {
  Container,
  Title,
  Tabs,
  Paper,
  Table,
  Text,
  ScrollArea,
  Button,
  Group,
  Badge,
  Box,
  Card,
  Stack,
} from "@mantine/core";
import { useEffect, useState, useCallback } from "react";
import Link from "@/components/link";
import RouteGuard from "@/services/auth/route-guard";
import useGlobalLoading from "@/services/loading/use-global-loading";
import { useGetIngredientsService } from "@/services/api/services/ingredients";
import { useGetMenuItemsService } from "@/services/api/services/menu-items";
import { useGetEquipmentService } from "@/services/api/services/equipment";
import { useGetAllergiesService } from "@/services/api/services/allergies";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { Ingredient } from "@/services/api/types/ingredient";
import { MenuItem } from "@/services/api/types/menu-item";
import { Equipment } from "@/services/api/types/equipment";
import { Allergy } from "@/services/api/types/allergy";
import { useResponsive } from "@/services/responsive/use-responsive";
import { IconEdit, IconPhoto } from "@tabler/icons-react";

interface ItemWithoutImage {
  id: string;
  name: string;
  type: "ingredient" | "menuItem" | "equipment" | "allergy";
}

function ItemsWithoutImages() {
  const { t } = useTranslation("admin-panel-items-without-images");
  const { setLoading } = useGlobalLoading();
  const { isMobile } = useResponsive();
  const [activeTab, setActiveTab] = useState<string>("ingredients");
  const [items, setItems] = useState<{
    ingredients: ItemWithoutImage[];
    menuItems: ItemWithoutImage[];
    equipment: ItemWithoutImage[];
    allergies: ItemWithoutImage[];
  }>({
    ingredients: [],
    menuItems: [],
    equipment: [],
    allergies: [],
  });
  const [loading, setLocalLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const getIngredientsService = useGetIngredientsService();
  const getMenuItemsService = useGetMenuItemsService();
  const getEquipmentService = useGetEquipmentService();
  const getAllergiesService = useGetAllergiesService();

  const fetchItemsWithoutImages = useCallback(async () => {
    setLocalLoading(true);
    setLoading(true);
    try {
      // Fetch all items in parallel - admin panel should see ALL items across all restaurants
      const [ingredientsRes, menuItemsRes, equipmentRes, allergiesRes] =
        await Promise.all([
          getIngredientsService(undefined, {
            page: 1,
            limit: 1000,
            // Don't filter by restaurant for admin panel
          }),
          getMenuItemsService(undefined, {
            page: 1,
            limit: 1000,
            // Don't filter by restaurant for admin panel
          }),
          getEquipmentService(undefined, { page: 1, limit: 1000 }),
          getAllergiesService(undefined, { page: 1, limit: 1000 }),
        ]);

      // Filter ingredients without images
      const ingredientsWithoutImages: ItemWithoutImage[] = [];
      if (ingredientsRes.status === HTTP_CODES_ENUM.OK) {
        const ingredientData =
          ingredientsRes.data?.data || ingredientsRes.data || [];

        if (Array.isArray(ingredientData)) {
          ingredientData.forEach((item: Ingredient) => {
            if (!item.ingredientImageUrl) {
              ingredientsWithoutImages.push({
                id: item.ingredientId,
                name: item.ingredientName,
                type: "ingredient",
              });
            }
          });
        }
      }

      // Filter menu items without images
      const menuItemsWithoutImages: ItemWithoutImage[] = [];
      if (menuItemsRes.status === HTTP_CODES_ENUM.OK) {
        const menuItemData = menuItemsRes.data?.data || menuItemsRes.data || [];

        if (Array.isArray(menuItemData)) {
          menuItemData.forEach((item: MenuItem) => {
            if (!item.menuItemUrl) {
              menuItemsWithoutImages.push({
                id: item.menuItemId,
                name: item.menuItemName,
                type: "menuItem",
              });
            }
          });
        }
      }

      // Filter equipment without images
      const equipmentWithoutImages: ItemWithoutImage[] = [];
      if (equipmentRes.status === HTTP_CODES_ENUM.OK) {
        const equipmentData =
          equipmentRes.data?.data || equipmentRes.data || [];

        if (Array.isArray(equipmentData)) {
          equipmentData.forEach((item: Equipment) => {
            if (!item.equipmentImageUrl) {
              equipmentWithoutImages.push({
                id: item.equipmentId,
                name: item.equipmentName,
                type: "equipment",
              });
            }
          });
        }
      }

      // Filter allergies without images
      const allergiesWithoutImages: ItemWithoutImage[] = [];
      if (allergiesRes.status === HTTP_CODES_ENUM.OK) {
        const allergyData = allergiesRes.data?.data || allergiesRes.data || [];

        if (Array.isArray(allergyData)) {
          allergyData.forEach((item: Allergy) => {
            if (!item.allergyLogoUrl) {
              allergiesWithoutImages.push({
                id: item.allergyId,
                name: item.allergyName,
                type: "allergy",
              });
            }
          });
        }
      }

      setItems({
        ingredients: ingredientsWithoutImages,
        menuItems: menuItemsWithoutImages,
        equipment: equipmentWithoutImages,
        allergies: allergiesWithoutImages,
      });
    } catch (error) {
      console.error("Error fetching items without images:", error);
    } finally {
      setLocalLoading(false);
      setLoading(false);
    }
  }, [
    getIngredientsService,
    getMenuItemsService,
    getEquipmentService,
    getAllergiesService,
    setLoading,
  ]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchItemsWithoutImages();
    }
  }, [mounted, fetchItemsWithoutImages]);

  const getEditUrl = (item: ItemWithoutImage) => {
    switch (item.type) {
      case "ingredient":
        return `/restaurant/ingredients/edit/${item.id}`;
      case "menuItem":
        return `/restaurant/menu-items/edit/${item.id}`;
      case "equipment":
        return `/admin-panel/equipment/edit/${item.id}`;
      case "allergy":
        return `/admin-panel/allergies/edit/${item.id}`;
      default:
        return "#";
    }
  };

  const renderTable = (itemList: ItemWithoutImage[]) => {
    if (isMobile) {
      return (
        <Stack gap="sm">
          {itemList.length === 0 ? (
            <Card p="lg" withBorder>
              <Text ta="center" c="dimmed">
                {loading
                  ? t("common:loading")
                  : t("itemsWithoutImages.noItems")}
              </Text>
            </Card>
          ) : (
            itemList.map((item) => (
              <Card key={item.id} p="sm" withBorder>
                <Group justify="space-between" align="center">
                  <Box flex={1}>
                    <Text size="sm" fw={500} lineClamp={1}>
                      {item.name}
                    </Text>
                  </Box>
                  <Button
                    component={Link}
                    href={getEditUrl(item)}
                    size="xs"
                    variant="light"
                    leftSection={<IconEdit size={14} />}
                  >
                    {t("common:edit")}
                  </Button>
                </Group>
              </Card>
            ))
          )}
        </Stack>
      );
    }

    return (
      <Paper shadow="xs" p="md">
        <ScrollArea h={500}>
          <Table striped highlightOnHover>
            <thead>
              <tr>
                <th>{t("itemsWithoutImages.table.name")}</th>
                <th style={{ width: 120, textAlign: "right" }}>
                  {t("itemsWithoutImages.table.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {itemList.length === 0 ? (
                <tr>
                  <td colSpan={2} style={{ textAlign: "center" }}>
                    <Text c="dimmed">
                      {loading
                        ? t("common:loading")
                        : t("itemsWithoutImages.noItems")}
                    </Text>
                  </td>
                </tr>
              ) : (
                itemList.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td style={{ textAlign: "right" }}>
                      <Button
                        component={Link}
                        href={getEditUrl(item)}
                        size="xs"
                        variant="light"
                        leftSection={<IconEdit size={14} />}
                      >
                        {t("common:edit")}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </ScrollArea>
      </Paper>
    );
  };

  const getTotalCount = () => {
    return (
      items.ingredients.length +
      items.menuItems.length +
      items.equipment.length +
      items.allergies.length
    );
  };

  return (
    <RouteGuard roles={[RoleEnum.ADMIN]}>
      <Container size={isMobile ? "100%" : "888px"}>
        <Group justify="space-between" mb="md">
          <Group>
            <IconPhoto size={28} />
            <Title order={3}>{t("itemsWithoutImages.title")}</Title>
          </Group>
          <Badge size="lg" variant="filled" color="gray">
            {getTotalCount()} {t("itemsWithoutImages.totalItems")}
          </Badge>
        </Group>

        <Tabs
          value={activeTab}
          onChange={(value) => setActiveTab(value || "ingredients")}
        >
          <Tabs.List>
            <Tabs.Tab value="ingredients">
              {t("itemsWithoutImages.tabs.ingredients")} (
              {items.ingredients.length})
            </Tabs.Tab>
            <Tabs.Tab value="menuItems">
              {t("itemsWithoutImages.tabs.menuItems")} ({items.menuItems.length}
              )
            </Tabs.Tab>
            <Tabs.Tab value="equipment">
              {t("itemsWithoutImages.tabs.equipment")} ({items.equipment.length}
              )
            </Tabs.Tab>
            <Tabs.Tab value="allergies">
              {t("itemsWithoutImages.tabs.allergies")} ({items.allergies.length}
              )
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="ingredients" pt="md">
            {renderTable(items.ingredients)}
          </Tabs.Panel>

          <Tabs.Panel value="menuItems" pt="md">
            {renderTable(items.menuItems)}
          </Tabs.Panel>

          <Tabs.Panel value="equipment" pt="md">
            {renderTable(items.equipment)}
          </Tabs.Panel>

          <Tabs.Panel value="allergies" pt="md">
            {renderTable(items.allergies)}
          </Tabs.Panel>
        </Tabs>
      </Container>
    </RouteGuard>
  );
}

export default ItemsWithoutImages;
