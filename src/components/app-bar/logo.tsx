// logo.tsx
"use client";
import { Anchor, Image, useMantineColorScheme, Box } from "@mantine/core";

interface LogoProps {
  isMobile?: boolean;
}

const Logo = ({ isMobile = false }: LogoProps) => {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  // Select logo based on theme
  const logoSrc = isDark
    ? "/MenuTrainingFullTransWhite4.png"
    : "/MenuTrainingFullTransBlack4.png";

  // Set different display for mobile vs desktop
  const display = isMobile
    ? { base: "flex", md: "none" }
    : { base: "none", md: "flex" };

  // Height based on mobile or desktop
  const logoHeight = isMobile ? 12 : 16;

  return (
    <Anchor
      href="/"
      underline="never"
      display={display}
      style={{
        flexGrow: isMobile ? 0 : 0,
        textDecoration: "none",
      }}
      data-testid={isMobile ? "mobile-logo-link" : "desktop-logo-link"}
    >
      <Box style={{ overflow: "hidden" }}>
        <Image
          src={logoSrc}
          alt="MenuTraining.com Logo"
          height={logoHeight}
          width="auto"
          fit="contain"
        />
      </Box>
    </Anchor>
  );
};

export default Logo;
