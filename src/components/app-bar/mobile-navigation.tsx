// src/components/app-bar/mobile-navigation.tsx
"use client";
import { useTranslation } from "@/services/i18n/client";
import { Divider, Stack, Collapse } from "@mantine/core";
import Link from "@/components/link";
import { getNavigationConfig } from "@/config/navigation";
import useAuth from "@/services/auth/use-auth";
import { IS_SIGN_UP_ENABLED } from "@/services/auth/config";
import { Button } from "@mantine/core";
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import { useState } from "react";

interface MobileNavigationProps {
  onCloseMenu?: () => void;
}

const MobileNavigation = ({ onCloseMenu }: MobileNavigationProps) => {
  const { t } = useTranslation("common");
  const { user, isLoaded } = useAuth();
  const navItems = getNavigationConfig();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {}
  );

  // Check if the user has the required role to view the nav item
  const hasRequiredRole = (roles?: number[]): boolean => {
    if (!roles || roles.length === 0) return true;
    if (!user?.role?.id) return false;
    return roles.map(String).includes(String(user.role.id));
  };

  // Toggle expanded group
  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  return (
    <Stack>
      {/* Navigation Items */}
      {navItems.map((item) => {
        if (item.desktopOnly || !hasRequiredRole(item.roles)) return null;

        // Handle grouped items
        if (item.isGroup && item.children) {
          // Filter children by role
          const validChildren = item.children.filter((child) =>
            hasRequiredRole(child.roles)
          );

          if (validChildren.length === 0) return null;

          const isExpanded = expandedGroups[item.label] || false;

          return (
            <Stack key={item.label} gap={0}>
              <Button
                variant="subtle"
                fullWidth
                onClick={() => toggleGroup(item.label)}
                rightSection={
                  isExpanded ? (
                    <IconChevronUp size={16} />
                  ) : (
                    <IconChevronDown size={16} />
                  )
                }
                justify="space-between"
              >
                {t(item.label)}
              </Button>
              <Collapse in={isExpanded}>
                <Stack pl="md" mt="xs">
                  {validChildren.map((child) => (
                    <Button
                      key={child.path}
                      component={Link}
                      href={child.path}
                      variant="subtle"
                      fullWidth
                      onClick={onCloseMenu}
                      size="compact-sm"
                    >
                      {t(child.label)}
                    </Button>
                  ))}
                </Stack>
              </Collapse>
            </Stack>
          );
        }

        // Regular item
        return (
          <Button
            key={item.path}
            component={Link}
            href={item.path}
            variant="subtle"
            fullWidth
            onClick={onCloseMenu}
          >
            {t(item.label)}
          </Button>
        );
      })}

      {/* Authentication Items (mobile only) */}
      {isLoaded && !user && (
        <>
          <Divider />
          <Button
            component={Link}
            href="/sign-in"
            variant="subtle"
            fullWidth
            onClick={onCloseMenu}
          >
            {t("common:navigation.signIn")}
          </Button>
          {IS_SIGN_UP_ENABLED && (
            <Button
              component={Link}
              href="/sign-up"
              variant="subtle"
              fullWidth
              onClick={onCloseMenu}
            >
              {t("common:navigation.signUp")}
            </Button>
          )}
        </>
      )}
    </Stack>
  );
};

export default MobileNavigation;
