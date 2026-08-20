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
    // O padrão do MUI é pintar o placeholder com 42% de opacidade sobre a cor
    // do texto, o que sobre o campo branco fica em ~2.8:1 e mal se lê. Cor
    // cheia no mesmo cinza de texto secundário da paleta (#475569 -> 7:1).
    MuiInputBase: {
      styleOverrides: {
        input: {
          "&::placeholder": { color: "#475569", opacity: 1 },
        },
      },
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
