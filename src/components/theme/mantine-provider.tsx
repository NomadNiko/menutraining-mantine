// src/components/theme/mantine-provider.tsx
import { MantineProvider, createTheme, ColorSchemeScript } from "@mantine/core";
import { oxanium } from "@/config/fonts";
import "@mantine/core/styles.css";

const theme = createTheme({
  primaryColor: "blue",
  colors: {
    blue: [
      "#E6F7FF",
      "#BAE7FF",
      "#91D5FF",
      "#69C0FF",
      "#40A9FF",
      "#1890FF",
      "#096DD9",
      "#0050B3",
      "#003A8C",
      "#002766",
    ],
  },
  fontFamily: `${oxanium.style.fontFamily}, system-ui, sans-serif`,
  components: {
    Button: {
      defaultProps: {
        size: "md",
      },
    },
    Table: {
      defaultProps: {
        withBorder: true,
        withColumnBorders: true,
      },
    },
  },
  other: {
    // Custom theme values for alternating row colors
    tableRowColors: {
      light: {
        even: "#ffffff",
        odd: "#f8f9fa",
      },
      dark: {
        even: "#25262b",
        odd: "#2c2e33",
      },
    },
  },
});

export function MantineProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ColorSchemeScript defaultColorScheme="light" />
      <MantineProvider theme={theme} defaultColorScheme="light">
        {children}
      </MantineProvider>
    </>
  );
}

// Replace InitColorSchemeScript with this component
export function InitColorSchemeScript() {
  return <ColorSchemeScript defaultColorScheme="light" />;
}
