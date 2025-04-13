// src/components/menu-sections/MenuSectionDataPreloader.tsx
"use client";
import { useEffect, useRef } from "react";
import { useGetMenuSectionService } from "@/services/api/services/menu-sections";
import { useGetMenuItemService } from "@/services/api/services/menu-items";
import { MenuSection } from "@/services/api/types/menu-section";
import { MenuItem } from "@/services/api/types/menu-item";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";

// Define our cache structure with proper types
export interface MenuSectionCache {
  sections: Record<string, MenuSection>;
  menuItems: Record<
    string,
    MenuItem & { price: number; sectionDescription?: string }
  >;
}

// Create a global cache object
const globalMenuSectionCache: MenuSectionCache = {
  sections: {},
  menuItems: {},
};

// Hook to access the global cache
export function useMenuSectionCache(): MenuSectionCache {
  return globalMenuSectionCache;
}

interface MenuSectionDataPreloaderProps {
  menuSections: MenuSection[];
}

export function MenuSectionDataPreloader({
  menuSections,
}: MenuSectionDataPreloaderProps) {
  const isPreloading = useRef(false);
  const getMenuSectionService = useGetMenuSectionService();
  const getMenuItemService = useGetMenuItemService();

  useEffect(() => {
    // Skip if already preloading or no menu sections to preload
    if (isPreloading.current || !menuSections.length) return;

    isPreloading.current = true;

    // Function to preload data for a single menu section
    const preloadMenuSectionData = async (menuSection: MenuSection) => {
      try {
        // Skip if we already have this section in cache with full details
        if (globalMenuSectionCache.sections[menuSection.id]) return;

        // Store menu section in cache
        globalMenuSectionCache.sections[menuSection.id] = menuSection;

        // If the section already has items, preload their detailed data
        if (menuSection.items && menuSection.items.length > 0) {
          for (const item of menuSection.items) {
            // Skip if we already have this menu item
            if (globalMenuSectionCache.menuItems[item.menuItemId]) continue;

            try {
              const menuItemResponse = await getMenuItemService({
                id: item.menuItemId,
              });

              if (menuItemResponse.status === HTTP_CODES_ENUM.OK) {
                globalMenuSectionCache.menuItems[item.menuItemId] = {
                  ...menuItemResponse.data,
                  price: item.price,
                  sectionDescription: item.description,
                };
              }
            } catch (error) {
              console.error("Error preloading menu item:", error);
            }
          }
        } else {
          // If we don't have full section data with items, fetch it
          try {
            const sectionResponse = await getMenuSectionService({
              id: menuSection.id,
            });

            if (sectionResponse.status === HTTP_CODES_ENUM.OK) {
              const sectionData = sectionResponse.data;
              globalMenuSectionCache.sections[menuSection.id] = sectionData;

              // Preload menu items
              for (const item of sectionData.items) {
                // Skip if we already have this menu item
                if (globalMenuSectionCache.menuItems[item.menuItemId]) continue;

                try {
                  const menuItemResponse = await getMenuItemService({
                    id: item.menuItemId,
                  });

                  if (menuItemResponse.status === HTTP_CODES_ENUM.OK) {
                    globalMenuSectionCache.menuItems[item.menuItemId] = {
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
            console.error("Error preloading full menu section:", error);
          }
        }
      } catch (error) {
        console.error("Error preloading menu section:", error);
      }
    };

    // Create a queue of menu sections to preload
    const queue = [...menuSections];

    // Process the queue with a throttled approach to avoid overwhelming the server
    let processed = 0;
    const processNext = async () => {
      if (queue.length === 0 || processed >= menuSections.length) {
        isPreloading.current = false;
        return;
      }

      const menuSection = queue.shift();
      if (menuSection) {
        await preloadMenuSectionData(menuSection);
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
  }, [menuSections, getMenuSectionService, getMenuItemService]);

  // This component doesn't render anything
  return null;
}
