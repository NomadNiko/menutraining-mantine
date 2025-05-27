// src/components/menus/MenuDataPreloader.tsx
"use client";
import { useEffect, useRef } from "react";
import { useGetMenuService } from "@/services/api/services/menus";
import { useGetMenuSectionService } from "@/services/api/services/menu-sections";
import { useGetMenuItemService } from "@/services/api/services/menu-items";
import { Menu } from "@/services/api/types/menu";
import { MenuSection } from "@/services/api/types/menu-section";
import { MenuItem } from "@/services/api/types/menu-item";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";

// Define our cache structure with proper types
export interface MenuCache {
  menus: Record<string, Menu>;
  sections: Record<string, MenuSection>;
  menuItems: Record<
    string,
    MenuItem & { price: number; sectionDescription?: string }
  >;
}

// Create a global cache object
const globalMenuCache: MenuCache = {
  menus: {},
  sections: {},
  menuItems: {},
};

// Hook to access the global cache
export function useMenuCache(): MenuCache {
  return globalMenuCache;
}

interface MenuDataPreloaderProps {
  menus: Menu[];
}

export function MenuDataPreloader({ menus }: MenuDataPreloaderProps) {
  const isPreloading = useRef(false);
  const getMenuService = useGetMenuService();
  const getMenuSectionService = useGetMenuSectionService();
  const getMenuItemService = useGetMenuItemService();

  useEffect(() => {
    // Skip if already preloading or no menus to preload
    if (isPreloading.current || !menus.length) return;

    isPreloading.current = true;

    // Function to preload data for a single menu
    const preloadMenuData = async (menu: Menu) => {
      try {
        // Skip if we already have this menu in cache
        if (globalMenuCache.menus[menu.menuId]) return;

        // Store menu in cache
        globalMenuCache.menus[menu.menuId] = menu;

        // Preload sections for this menu
        for (const sectionId of menu.menuSections) {
          // Skip if we already have this section
          if (globalMenuCache.sections[sectionId]) continue;

          try {
            const sectionResponse = await getMenuSectionService({
              menuSectionId: sectionId,
            });

            if (sectionResponse.status === HTTP_CODES_ENUM.OK) {
              const sectionData = sectionResponse.data;
              globalMenuCache.sections[sectionId] = sectionData;

              // Preload menu items for this section
              for (const item of sectionData.items) {
                // Skip if we already have this menu item
                if (globalMenuCache.menuItems[item.menuItemId]) continue;

                try {
                  const menuItemResponse = await getMenuItemService({
                    menuItemId: item.menuItemId,
                  });

                  if (menuItemResponse.status === HTTP_CODES_ENUM.OK) {
                    globalMenuCache.menuItems[item.menuItemId] = {
                      ...menuItemResponse.data,
                      price: item.price,
                      sectionDescription: item.description,
                    };
                  }
                } catch (error) {
                  console.error("Error preloading menu item:", error);
                }
              }
            }
          } catch (error) {
            console.error("Error preloading menu section:", error);
          }
        }
      } catch (error) {
        console.error("Error preloading menu:", error);
      }
    };

    // Create a queue of menus to preload
    const queue = [...menus];

    // Process the queue with a throttled approach to avoid overwhelming the server
    let processed = 0;
    const processNext = async () => {
      if (queue.length === 0 || processed >= menus.length) {
        isPreloading.current = false;
        return;
      }

      const menu = queue.shift();
      if (menu) {
        await preloadMenuData(menu);
        processed++;

        // Small delay to prevent API rate limiting and UI blocking
        setTimeout(processNext, 100);
      }
    };

    // Start processing the queue
    processNext();

    // Cleanup function
    return () => {
      isPreloading.current = false;
    };
  }, [menus, getMenuService, getMenuSectionService, getMenuItemService]);

  // This component doesn't render anything
  return null;
}
