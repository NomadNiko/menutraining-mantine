// ./menutraining-mantine/src/components/app-bar/auth-section.tsx
"use client";
import { useState } from "react";
import { useTranslation } from "@/services/i18n/client";
import {
  Box,
  Avatar,
  Menu,
  Button,
  Group,
  Loader,
  Text,
  ActionIcon,
} from "@mantine/core";
import Link from "@/components/link";
import useAuth from "@/services/auth/use-auth";
import useAuthActions from "@/services/auth/use-auth-actions";
import { IS_SIGN_UP_ENABLED } from "@/services/auth/config";
import { useResponsive } from "@/services/responsive/use-responsive";
import { IconUser } from "@tabler/icons-react";

const AuthSection = () => {
  const { t } = useTranslation("common");
  const { user, isLoaded } = useAuth();
  const { logOut } = useAuthActions();
  const [menuOpened, setMenuOpened] = useState(false);
  const { isMobile } = useResponsive();

  if (!isLoaded) {
    return <Loader color="inherit" />;
  }

  if (user) {
    return (
      <Box>
        <Menu
          opened={menuOpened}
          onChange={setMenuOpened}
          position="bottom-end"
          offset={5}
        >
          <Menu.Target>
            <Avatar
              src={user.photo?.path}
              alt={user?.firstName + " " + user?.lastName}
              radius="xl"
              size="md"
              style={{ cursor: "pointer" }}
              data-testid="profile-menu-item"
            />
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              component={Link}
              href="/profile"
              data-testid="user-profile"
            >
              <Text>{t("common:navigation.profile")}</Text>
            </Menu.Item>
            <Menu.Item onClick={() => logOut()} data-testid="logout-menu-item">
              <Text>{t("common:navigation.logout")}</Text>
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Box>
    );
  }

  // Guest user - show login/signup icon with dropdown on mobile, buttons on desktop
  return (
    <Box style={{ display: "flex" }}>
      {isMobile ? (
        <Menu position="bottom-end" offset={5}>
          <Menu.Target>
            <ActionIcon
              variant="subtle"
              size="lg"
              aria-label="Authentication options"
              data-testid="auth-menu-icon"
            >
              <IconUser size={24} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              component={Link}
              href="/sign-in"
              data-testid="sign-in-menu-item"
            >
              {t("common:navigation.signIn")}
            </Menu.Item>
            {IS_SIGN_UP_ENABLED && (
              <Menu.Item
                component={Link}
                href="/sign-up"
                data-testid="sign-up-menu-item"
              >
                {t("common:navigation.signUp")}
              </Menu.Item>
            )}
          </Menu.Dropdown>
        </Menu>
      ) : (
        <Group>
          <Button
            component={Link}
            href="/sign-in"
            variant="subtle"
            size="compact-sm"
            data-testid="desktop-sign-in-button"
          >
            {t("common:navigation.signIn")}
          </Button>
          {IS_SIGN_UP_ENABLED && (
            <Button
              component={Link}
              href="/sign-up"
              variant="filled"
              size="compact-sm"
              data-testid="desktop-sign-up-button"
            >
              {t("common:navigation.signUp")}
            </Button>
          )}
        </Group>
      )}
    </Box>
  );
};

export default AuthSection;
