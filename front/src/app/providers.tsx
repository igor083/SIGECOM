"use client";

import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import type { ReactNode } from "react";

const theme = createTheme({
  palette: {
    primary: { main: "#2563eb" },
  },
  typography: {
    fontFamily:
      "var(--font-inter), Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  components: {
    MuiButton: {
      styleOverrides: { root: { textTransform: "none", fontWeight: 600 } },
    },
  },
});

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
  );
}
