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
  // Admin Group
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
    ],
  },
  // Food Group for Admin
  {
    label: "common:navigation.food",
    path: "#",
    roles: [RoleEnum.ADMIN],
    isGroup: true,
    children: [
      {
        label: "common:navigation.ingredients",
        path: "/admin-panel/ingredients",
        roles: [RoleEnum.ADMIN],
      },
      {
        label: "common:navigation.menuItems",
        path: "/admin-panel/menu-items",
        roles: [RoleEnum.ADMIN],
      },
      {
        label: "common:navigation.recipes",
        path: "/admin-panel/recipes",
        roles: [RoleEnum.ADMIN],
      },
    ],
  },
  // Menu Group for Admin
  {
    label: "common:navigation.menuGroup",
    path: "#",
    roles: [RoleEnum.ADMIN],
    isGroup: true,
    children: [
      {
        label: "common:navigation.menuSections",
        path: "/admin-panel/menu-sections",
        roles: [RoleEnum.ADMIN],
      },
      {
        label: "common:navigation.menus",
        path: "/admin-panel/menus",
        roles: [RoleEnum.ADMIN],
      },
    ],
  },
  // Food Group for Regular Users
  {
    label: "common:navigation.food",
    path: "#",
    roles: [RoleEnum.USER],
    isGroup: true,
    children: [
      {
        label: "common:navigation.ingredients",
        path: "/restaurant/ingredients",
        roles: [RoleEnum.USER],
      },
      {
        label: "common:navigation.menuItems",
        path: "/restaurant/menu-items",
        roles: [RoleEnum.USER],
      },
      {
        label: "common:navigation.recipes",
        path: "/restaurant/recipes",
        roles: [RoleEnum.USER],
      },
    ],
  },
  // Menu Group for Regular Users
  {
    label: "common:navigation.menuGroup",
    path: "#",
    roles: [RoleEnum.USER],
    isGroup: true,
    children: [
      {
        label: "common:navigation.menuSections",
        path: "/restaurant/menu-sections",
        roles: [RoleEnum.USER],
      },
      {
        label: "common:navigation.menus",
        path: "/restaurant/menus",
        roles: [RoleEnum.USER],
      },
    ],
  },
];

export const getNavigationConfig = () => createNavigationConfig();
