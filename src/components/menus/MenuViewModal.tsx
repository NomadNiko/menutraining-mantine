// src/components/menus/MenuViewModal.tsx
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
import { useGetMenuService } from "@/services/api/services/menus";
import { useGetMenuSectionService } from "@/services/api/services/menu-sections";
import { useGetMenuItemService } from "@/services/api/services/menu-items";
import { Menu, DayOfWeek } from "@/services/api/types/menu";
import { MenuSection, SectionItem } from "@/services/api/types/menu-section";
import { MenuItem } from "@/services/api/types/menu-item";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { formatPriceDisplay } from "@/utils/price-formatter";
import { useResponsive } from "@/services/responsive/use-responsive";
import { useMenuCache } from "./MenuDataPreloader";

interface MenuViewModalProps {
  menuId: string | null;
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

interface MenuWithSections extends Menu {
  sections: MenuSectionWithItems[];
}

export function MenuViewModal({
  menuId,
  restaurantName,
  opened,
  onClose,
}: MenuViewModalProps) {
  const { t } = useTranslation("restaurant-menus");
  const { isMobile } = useResponsive();
  const [menu, setMenu] = useState<MenuWithSections | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get our preloaded cache
  const cache = useMenuCache();

  const getMenuService = useGetMenuService();
  const getMenuSectionService = useGetMenuSectionService();
  const getMenuItemService = useGetMenuItemService();

  // Format days of week display
  const formatDays = (days: DayOfWeek[]) => {
    if (!days || days.length === 0) return "-";
    // If all days are selected
    if (days.length === 7) return t("days.everyday");
    // If weekdays
    const weekdays = [
      DayOfWeek.MONDAY,
      DayOfWeek.TUESDAY,
      DayOfWeek.WEDNESDAY,
      DayOfWeek.THURSDAY,
      DayOfWeek.FRIDAY,
    ];
    const isWeekdays =
      weekdays.every((day) => days.includes(day)) && days.length === 5;
    if (isWeekdays) return t("days.weekdays");
    // If weekend
    const weekend = [DayOfWeek.SATURDAY, DayOfWeek.SUNDAY];
    const isWeekend =
      weekend.every((day) => days.includes(day)) && days.length === 2;
    if (isWeekend) return t("days.weekend");
    // Otherwise, list the days
    return days.map((day) => t(`days.short.${day}`)).join(", ");
  };

  useEffect(() => {
    if (!menuId || !opened) {
      return;
    }

    const fetchMenuData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Check if menu is already in cache
        const cachedMenu = cache.menus[menuId];
        if (cachedMenu) {
          const menuData = cachedMenu;
          const menuSections: MenuSectionWithItems[] = [];

          // Process sections
          for (const sectionId of menuData.menuSections) {
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

              menuSections.push({
                ...sectionData,
                menuItems: sortedItems,
              });
            } else {
              // Fall back to API if section not in cache
              try {
                const sectionResponse = await getMenuSectionService({
                  id: sectionId,
                });
                if (sectionResponse.status === HTTP_CODES_ENUM.OK) {
                  const sectionData = sectionResponse.data;
                  const menuItems: MenuItemWithSectionData[] = [];

                  // Cache the section for future use
                  cache.sections[sectionId] = sectionData;

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

                  menuSections.push({
                    ...sectionData,
                    menuItems: sortedItems,
                  });
                }
              } catch (error) {
                console.error("Error fetching menu section:", error);
              }
            }
          }

          // Sort sections based on order in the menu
          const sortedSections = [...menuSections].sort((a, b) => {
            const aIndex = menuData.menuSections.indexOf(a.menuSectionId);
            const bIndex = menuData.menuSections.indexOf(b.menuSectionId);
            return aIndex - bIndex;
          });

          setMenu({
            ...menuData,
            sections: sortedSections,
          });
        } else {
          // If not in cache, fall back to API call pattern
          const { status, data } = await getMenuService({ id: menuId });
          if (status !== HTTP_CODES_ENUM.OK) {
            throw new Error(t("errors.menuNotFound"));
          }

          const menuData = data;
          // Store in cache for future use
          cache.menus[menuId] = menuData;

          const menuSections: MenuSectionWithItems[] = [];

          // Process sections and items as before...
          for (const sectionId of menuData.menuSections) {
            try {
              const sectionResponse = await getMenuSectionService({
                id: sectionId,
              });
              if (sectionResponse.status === HTTP_CODES_ENUM.OK) {
                const sectionData = sectionResponse.data;
                // Store in cache
                cache.sections[sectionId] = sectionData;

                const menuItems: MenuItemWithSectionData[] = [];

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

                // Sort items and add to sections as before
                const sortedItems = [...menuItems].sort((a, b) => {
                  const aIndex = sectionData.items.findIndex(
                    (item: SectionItem) => item.menuItemId === a.menuItemId
                  );
                  const bIndex = sectionData.items.findIndex(
                    (item: SectionItem) => item.menuItemId === b.menuItemId
                  );
                  return aIndex - bIndex;
                });

                menuSections.push({
                  ...sectionData,
                  menuItems: sortedItems,
                });
              }
            } catch (error) {
              console.error("Error fetching menu section:", error);
            }
          }

          // Sort sections and set state as before
          const sortedSections = [...menuSections].sort((a, b) => {
            const aIndex = menuData.menuSections.indexOf(a.menuSectionId);
            const bIndex = menuData.menuSections.indexOf(b.menuSectionId);
            return aIndex - bIndex;
          });

          setMenu({
            ...menuData,
            sections: sortedSections,
          });
        }
      } catch (error) {
        console.error("Error fetching menu:", error);
        setError(t("errors.loadingFailed"));
      } finally {
        setLoading(false);
      }
    };

    fetchMenuData();
  }, [
    menuId,
    opened,
    getMenuService,
    getMenuSectionService,
    getMenuItemService,
    t,
    cache,
  ]);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t("viewMenu.title")}
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
      ) : menu ? (
        <Stack gap="md">
          <Box>
            <Text size="sm" c="dimmed">
              {t("viewMenu.restaurant")}
            </Text>
            <Title order={3}>{restaurantName}</Title>
          </Box>
          <Box>
            <Title order={4}>{menu.name}</Title>
            {menu.description && <Text>{menu.description}</Text>}
            <Group gap="md" mt="xs">
              <Badge color="blue">
                {t("viewMenu.available")}: {formatDays(menu.activeDays)}
              </Badge>
              {menu.startTime && menu.endTime && (
                <Badge color="green">
                  {t("viewMenu.timeRange")}: {menu.startTime} - {menu.endTime}
                </Badge>
              )}
            </Group>
          </Box>
          <Divider />
          {menu.sections.length === 0 ? (
            <Text ta="center" c="dimmed">
              {t("viewMenu.noSections")}
            </Text>
          ) : (
            menu.sections.map((section) => (
              <Box key={section.id}>
                <Group justify="space-between" mb="xs">
                  <Title order={5}>{section.title}</Title>
                  {section.startTime && section.endTime && (
                    <Badge size="sm">
                      {section.startTime} - {section.endTime}
                    </Badge>
                  )}
                </Group>
                {section.description && (
                  <Text size="sm" mb="md">
                    {section.description}
                  </Text>
                )}
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
                                  {t("viewMenu.allergies")}:
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
                                  {t("viewMenu.ingredients")}:{" "}
                                  {item.ingredientNames.join(", ")}
                                </Text>
                              )}
                          </Stack>
                        </Group>
                      </Card>
                    </Grid.Col>
                  ))}
                </Grid>
                <Divider my="md" />
              </Box>
            ))
          )}
        </Stack>
      ) : (
        <Text ta="center" c="dimmed">
          {t("viewMenu.selectMenu")}
        </Text>
      )}
    </Modal>
  );
}
