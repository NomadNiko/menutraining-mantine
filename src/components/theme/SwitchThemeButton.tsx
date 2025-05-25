import { ActionIcon, useMantineColorScheme } from "@mantine/core";
import { IconSun, IconMoon } from "@tabler/icons-react";
export function SwitchThemeButton() {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";
  return (
    <ActionIcon
      onClick={() => toggleColorScheme()}
      variant="transparent"
      color={isDark ? "yellow" : "blue"}
      aria-label="Toggle color scheme"
      size="lg"
      data-testid="theme-switch-button"
    >
      {isDark ? <IconSun size={24} /> : <IconMoon size={23} />}
    </ActionIcon>
  );
}
