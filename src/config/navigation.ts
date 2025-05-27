// src/config/navigation.ts
import { RoleEnum } from "@/services/api/types/role";

export interface NavigationItem {
  label: string;
  path: string;
  roles?: number[];
  mobileOnly?: boolean;
  desktopOnly?: boolean;
  children?: NavigationItem[];
  isGroup?: boolean;
}

const createNavigationConfig = (): NavigationItem[] => [
  {
    label: "common:navigation.home",
    path: "/",
  },
  // Food Group - for both admins and users
  {
    label: "common:navigation.food",
    path: "#",
    roles: [RoleEnum.ADMIN, RoleEnum.USER],
    isGroup: true,
    children: [
      {
        label: "common:navigation.ingredients",
        path: "/restaurant/ingredients",
        roles: [RoleEnum.ADMIN, RoleEnum.USER],
      },
      {
        label: "common:navigation.recipes",
        path: "/restaurant/recipes",
        roles: [RoleEnum.ADMIN, RoleEnum.USER],
      },
    ],
  },
  // Menu Group - for both admins and users
  {
    label: "common:navigation.menuGroup",
    path: "#",
    roles: [RoleEnum.ADMIN, RoleEnum.USER, RoleEnum.FOH],
    isGroup: true,
    children: [
      {
        label: "common:navigation.menuItems",
        path: "/restaurant/menu-items",
        roles: [RoleEnum.ADMIN, RoleEnum.USER],
      },
      {
        label: "common:navigation.menuSections",
        path: "/restaurant/menu-sections",
        roles: [RoleEnum.ADMIN, RoleEnum.USER],
      },
      {
        label: "common:navigation.menus",
        path: "/restaurant/menus",
        roles: [RoleEnum.ADMIN, RoleEnum.USER],
      },
      {
        label: "common:navigation.quiz",
        path: "/restaurant/quiz",
        roles: [RoleEnum.ADMIN, RoleEnum.USER, RoleEnum.FOH], // Only for regular users
      },
    ],
  },
  // Admin-only sections
  {
    label: "common:navigation.admin",
    path: "#",
    roles: [RoleEnum.ADMIN],
    isGroup: true,
    children: [
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
        label: "common:navigation.itemsWithoutImages",
        path: "/admin-panel/items-without-images",
        roles: [RoleEnum.ADMIN],
      },
    ],
  },
];

export const getNavigationConfig = () => createNavigationConfig();
