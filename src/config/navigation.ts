// src/config/navigation.ts
import { RoleEnum } from "@/services/api/types/role";

export interface NavigationItem {
  label: string; // i18n key for the navigation item label
  path: string; // Route path
  roles?: number[]; // Required roles for access (undefined means accessible to all)
  mobileOnly?: boolean; // Only show in mobile menu
  desktopOnly?: boolean; // Only show in desktop menu
  children?: NavigationItem[]; // Submenu items
}

const createNavigationConfig = (): NavigationItem[] => [
  {
    label: "common:navigation.home",
    path: "/",
  },
  {
    label: "common:navigation.users",
    path: "/admin-panel/users",
    roles: [RoleEnum.ADMIN],
  },
  {
    label: "common:navigation.restaurants",
    path: "/admin-panel/restaurants",
    roles: [RoleEnum.ADMIN],
  },
  {
    label: "common:navigation.allergies",
    path: "/admin-panel/allergies",
    roles: [RoleEnum.ADMIN],
  },
  {
    label: "common:navigation.equipment",
    path: "/admin-panel/equipment",
    roles: [RoleEnum.ADMIN],
  },
  {
    label: "common:navigation.ingredients",
    path: "/admin-panel/ingredients",
    roles: [RoleEnum.ADMIN],
  },
  // New route for regular users for ingredients
  {
    label: "common:navigation.ingredients",
    path: "/restaurant/ingredients",
    roles: [RoleEnum.USER],
  },
  {
    label: "common:navigation.menuItems",
    path: "/admin-panel/menu-items",
    roles: [RoleEnum.ADMIN],
  },
  // New route for regular users for menu items
  {
    label: "common:navigation.menuItems",
    path: "/restaurant/menu-items",
    roles: [RoleEnum.USER],
  },
  {
    label: "common:navigation.menuSections",
    path: "/admin-panel/menu-sections",
    roles: [RoleEnum.ADMIN],
  },
  {
    label: "common:navigation.menuSections",
    path: "/restaurant/menu-sections",
    roles: [RoleEnum.USER],
  },
  {
    label: "common:navigation.menus",
    path: "/admin-panel/menus",
    roles: [RoleEnum.ADMIN],
  },
  {
    label: "common:navigation.menus",
    path: "/restaurant/menus",
    roles: [RoleEnum.USER],
  },
];

// Return navigation config with authentication items
export const getNavigationConfig = () => createNavigationConfig();
