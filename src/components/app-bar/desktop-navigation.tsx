// src/components/app-bar/desktop-navigation.tsx
"use client";
import { useTranslation } from "@/services/i18n/client";
import { Group, Button, Menu } from "@mantine/core";
import Link from "@/components/link";
import { getNavigationConfig } from "@/config/navigation";
import useAuth from "@/services/auth/use-auth";
import { IconChevronDown } from "@tabler/icons-react";
import { useState } from "react";

interface DesktopNavigationProps {
  onCloseMenu?: () => void;
}

const DesktopNavigation = ({ onCloseMenu }: DesktopNavigationProps) => {
  const { t } = useTranslation("common");
  const { user } = useAuth();
  const navItems = getNavigationConfig();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  // Check if the user has the required role to view the nav item
  const hasRequiredRole = (roles?: number[]): boolean => {
    if (!roles || roles.length === 0) return true;
    if (!user?.role?.id) return false;
    return roles.map(String).includes(String(user.role.id));
  };

  // Toggle dropdown menu
  const toggleMenu = (label: string) => {
    setOpenMenus((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  // Close menu when clicked
  const handleItemClick = () => {
    setOpenMenus({});
    if (onCloseMenu) onCloseMenu();
  };

  return (
    <Group gap="sm" display={{ base: "none", md: "flex" }}>
      {navItems.map((item) => {
        if (item.mobileOnly || !hasRequiredRole(item.roles)) return null;

        // Handle dropdown menus
        if (item.isGroup && item.children) {
          // Filter children by role
          const validChildren = item.children.filter((child) =>
            hasRequiredRole(child.roles)
          );

          if (validChildren.length === 0) return null;

          return (
            <Menu
              key={item.label}
              opened={openMenus[item.label] || false}
              onChange={(opened) =>
                setOpenMenus((prev) => ({ ...prev, [item.label]: opened }))
              }
              position="bottom-start"
              offset={5}
              shadow="md"
              width={200}
            >
              <Menu.Target>
                <Button
                  variant="subtle"
                  rightSection={<IconChevronDown size={16} />}
                  size="compact-sm"
                  onClick={() => toggleMenu(item.label)}
                >
                  {t(item.label)}
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                {validChildren.map((child) => (
                  <Menu.Item
                    key={child.path}
                    component={Link}
                    href={child.path}
                    onClick={handleItemClick}
                  >
                    {t(child.label)}
                  </Menu.Item>
                ))}
              </Menu.Dropdown>
            </Menu>
          );
        }

        // Regular menu item
        return (
          <Button
            key={item.path}
            onClick={onCloseMenu}
            variant="subtle"
            component={Link}
            href={item.path}
            size="compact-sm"
          >
            {t(item.label)}
          </Button>
        );
      })}
    </Group>
  );
};

export default DesktopNavigation;
