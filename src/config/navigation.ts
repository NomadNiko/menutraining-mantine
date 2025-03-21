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
    label: "common:navigation.ingredients",
    path: "/admin-panel/ingredients",
    roles: [RoleEnum.ADMIN, RoleEnum.USER],
  },
  {
    label: "common:navigation.menuItems",
    path: "/admin-panel/menu-items",
    roles: [RoleEnum.ADMIN, RoleEnum.USER],
  },
];

// Return navigation config with authentication items
export const getNavigationConfig = () => createNavigationConfig();
