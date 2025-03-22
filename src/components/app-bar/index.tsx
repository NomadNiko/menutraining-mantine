"use client";
import { AppShell, Burger, Group, Container } from "@mantine/core";
import { useState } from "react";
import { SwitchThemeButton } from "@/components/theme/SwitchThemeButton";
import Logo from "./logo";
import DesktopNavigation from "./desktop-navigation";
import MobileNavigation from "./mobile-navigation";
import AuthSection from "./auth-section";
import RestaurantSelector from "../restaurant-selector/restaurant-selector";
import useAuth from "@/services/auth/use-auth";
import { RoleEnum } from "@/services/api/types/role";

const ResponsiveAppBar = ({ children }: { children: React.ReactNode }) => {
  const [opened, setOpened] = useState(false);
  const { user } = useAuth();

  // Correct role checking pattern matching the rest of the application
  const isRegularUser =
    user && user.role?.id && String(user.role.id) === String(RoleEnum.USER);

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: { base: 240, sm: 300 },
        breakpoint: "sm",
        collapsed: { desktop: true, mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Container size="xl" py="md">
          <Group justify="space-between">
            {/* Left side: Burger (mobile), Logo, Navigation Links */}
            <Group>
              {/* Mobile Burger */}
              <Burger
                opened={opened}
                onClick={() => setOpened((o) => !o)}
                hiddenFrom="md"
                size="sm"
              />
              {/* Desktop Logo */}
              <Logo />
              {/* Desktop Navigation - moved next to Logo */}
              <DesktopNavigation onCloseMenu={() => setOpened(false)} />
            </Group>
            {/* Mobile Logo - centered */}
            <Logo isMobile />
            {/* Right side: Restaurant Selector, Theme Switch and Auth Section */}
            <Group>
              {/* Restaurant Selector - only for regular users */}
              {isRegularUser && <RestaurantSelector />}
              {/* Theme Switch Button */}
              <SwitchThemeButton />
              {/* Authentication Section */}
              <AuthSection />
            </Group>
          </Group>
        </Container>
      </AppShell.Header>
      <AppShell.Navbar p="md">
        <MobileNavigation onCloseMenu={() => setOpened(false)} />
      </AppShell.Navbar>
      <AppShell.Main>{children}</AppShell.Main>
      {/* Overlay to allow clicking outside navbar to close it */}
      {opened && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.3)",
            zIndex: 5, // Lower than default Mantine navbar z-index
            cursor: "pointer",
          }}
          onClick={() => setOpened(false)}
        />
      )}
    </AppShell>
  );
};

export default ResponsiveAppBar;
