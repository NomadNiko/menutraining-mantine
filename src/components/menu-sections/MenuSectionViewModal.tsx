// src/components/menu-sections/MenuSectionViewModal.tsx
import { useEffect, useState } from "react";
import {
  Modal,
  Group,
  Title,
  Text,
  Loader,
  Stack,
  Badge,
  Grid,
  Card,
  Image,
  Divider,
  Box,
} from "@mantine/core";
import { useTranslation } from "@/services/i18n/client";
import { useGetMenuSectionService } from "@/services/api/services/menu-sections";
import { useGetMenuItemService } from "@/services/api/services/menu-items";
import { MenuSection, SectionItem } from "@/services/api/types/menu-section";
import { MenuItem } from "@/services/api/types/menu-item";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { formatPriceDisplay } from "@/utils/price-formatter";
import { useResponsive } from "@/services/responsive/use-responsive";
import { useMenuSectionCache } from "./MenuSectionDataPreloader";

interface MenuSectionViewModalProps {
  sectionId: string | null;
  restaurantName: string;
  opened: boolean;
  onClose: () => void;
}

// Extended MenuItem type with section data
interface MenuItemWithSectionData extends MenuItem {
  price: number;
  sectionDescription?: string;
}

interface MenuSectionWithItems extends MenuSection {
  menuItems: MenuItemWithSectionData[];
}

export function MenuSectionViewModal({
  sectionId,
  restaurantName,
  opened,
  onClose,
}: MenuSectionViewModalProps) {
  const { t } = useTranslation("restaurant-menu-sections");
  const { isMobile } = useResponsive();
  const [section, setSection] = useState<MenuSectionWithItems | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get our preloaded cache
  const cache = useMenuSectionCache();

  const getMenuSectionService = useGetMenuSectionService();
  const getMenuItemService = useGetMenuItemService();

  useEffect(() => {
    if (!sectionId || !opened) {
      return;
    }

    const fetchSectionData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Check if section is already in cache
        const cachedSection = cache.sections[sectionId];
        if (cachedSection) {
          const sectionData = cachedSection;
          const menuItems: MenuItemWithSectionData[] = [];

          // Process items
          for (const item of sectionData.items) {
            const cachedMenuItem = cache.menuItems[item.menuItemId];
            if (cachedMenuItem) {
              menuItems.push(cachedMenuItem);
            } else {
              // Fall back to API if not in cache
              try {
                const menuItemResponse = await getMenuItemService({
                  id: item.menuItemId,
                });
                if (menuItemResponse.status === HTTP_CODES_ENUM.OK) {
                  const menuItem: MenuItemWithSectionData = {
                    ...menuItemResponse.data,
                    price: item.price,
                    sectionDescription: item.description,
                  };
                  menuItems.push(menuItem);
                  // Also store in cache for future use
                  cache.menuItems[item.menuItemId] = menuItem;
                }
              } catch (error) {
                console.error("Error fetching menu item:", error);
              }
            }
          }

          // Sort items by order
          const sortedItems = [...menuItems].sort((a, b) => {
            const aIndex = sectionData.items.findIndex(
              (item: SectionItem) => item.menuItemId === a.menuItemId
            );
            const bIndex = sectionData.items.findIndex(
              (item: SectionItem) => item.menuItemId === b.menuItemId
            );
            return aIndex - bIndex;
          });

          setSection({
            ...sectionData,
            menuItems: sortedItems,
          });
        } else {
          // If not in cache, fall back to API call
          const { status, data } = await getMenuSectionService({
            id: sectionId,
          });
          if (status !== HTTP_CODES_ENUM.OK) {
            throw new Error(t("errors.sectionNotFound"));
          }

          const sectionData = data;
          // Store in cache for future use
          cache.sections[sectionId] = sectionData;

          const menuItems: MenuItemWithSectionData[] = [];

          // Process items
          for (const item of sectionData.items) {
            try {
              const menuItemResponse = await getMenuItemService({
                id: item.menuItemId,
              });
              if (menuItemResponse.status === HTTP_CODES_ENUM.OK) {
                const menuItem: MenuItemWithSectionData = {
                  ...menuItemResponse.data,
                  price: item.price,
                  sectionDescription: item.description,
                };
                menuItems.push(menuItem);
                // Store in cache
                cache.menuItems[item.menuItemId] = menuItem;
              }
            } catch (error) {
              console.error("Error fetching menu item:", error);
            }
          }

          // Sort items by order
          const sortedItems = [...menuItems].sort((a, b) => {
            const aIndex = sectionData.items.findIndex(
              (item: SectionItem) => item.menuItemId === a.menuItemId
            );
            const bIndex = sectionData.items.findIndex(
              (item: SectionItem) => item.menuItemId === b.menuItemId
            );
            return aIndex - bIndex;
          });

          setSection({
            ...sectionData,
            menuItems: sortedItems,
          });
        }
      } catch (error) {
        console.error("Error fetching menu section:", error);
        setError(t("errors.loadingFailed"));
      } finally {
        setLoading(false);
      }
    };

    fetchSectionData();
  }, [sectionId, opened, getMenuSectionService, getMenuItemService, t, cache]);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t("viewSection.title")}
      size={isMobile ? "full" : "xl"}
      centered
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
    >
      {loading ? (
        <Group justify="center" p="xl">
          <Loader size="lg" />
        </Group>
      ) : error ? (
        <Text color="red" ta="center" p="md">
          {error}
        </Text>
      ) : section ? (
        <Stack gap="md">
          <Box>
            <Text size="sm" c="dimmed">
              {t("viewSection.restaurant")}
            </Text>
            <Title order={3}>{restaurantName}</Title>
          </Box>
          <Box>
            <Title order={4}>{section.title}</Title>
            {section.description && <Text>{section.description}</Text>}
            {section.startTime && section.endTime && (
              <Group gap="md" mt="xs">
                <Badge color="blue">
                  {t("viewSection.timeRange")}: {section.startTime} -{" "}
                  {section.endTime}
                </Badge>
              </Group>
            )}
          </Box>
          <Divider />
          {section.menuItems.length === 0 ? (
            <Text ta="center" c="dimmed">
              {t("viewSection.noItems")}
            </Text>
          ) : (
            <Box>
              <Title order={5} mb="md">
                {t("viewSection.items")}
              </Title>
              <Grid>
                {section.menuItems.map((item) => (
                  <Grid.Col key={item.id} span={{ base: 12, md: 6 }}>
                    <Card withBorder p="sm">
                      <Group align="flex-start" wrap="nowrap">
                        {item.menuItemUrl && (
                          <Image
                            src={item.menuItemUrl}
                            alt={item.menuItemName}
                            width={80}
                            height={80}
                            radius="md"
                          />
                        )}
                        <Stack gap="xs" style={{ flex: 1 }}>
                          <Group justify="space-between" wrap="nowrap">
                            <Text fw={500}>{item.menuItemName}</Text>
                            <Text fw={500}>
                              {formatPriceDisplay(item.price)}
                            </Text>
                          </Group>
                          {(item.sectionDescription ||
                            item.menuItemDescription) && (
                            <Text size="sm" lineClamp={2}>
                              {item.sectionDescription ||
                                item.menuItemDescription}
                            </Text>
                          )}
                          {item.allergies && item.allergies.length > 0 && (
                            <Group gap="xs">
                              <Text size="xs" c="dimmed">
                                {t("viewSection.allergies")}:
                              </Text>
                              {item.allergies.map((allergy) => (
                                <Badge
                                  key={allergy.id}
                                  size="xs"
                                  color="red"
                                  variant="filled"
                                >
                                  {allergy.name}
                                </Badge>
                              ))}
                            </Group>
                          )}
                          {item.ingredientNames &&
                            item.ingredientNames.length > 0 && (
                              <Text size="xs" c="dimmed">
                                {t("viewSection.ingredients")}:{" "}
                                {item.ingredientNames.join(", ")}
                              </Text>
                            )}
                        </Stack>
                      </Group>
                    </Card>
                  </Grid.Col>
                ))}
              </Grid>
            </Box>
          )}
        </Stack>
      ) : (
        <Text ta="center" c="dimmed">
          {t("viewSection.selectSection")}
        </Text>
      )}
    </Modal>
  );
}
