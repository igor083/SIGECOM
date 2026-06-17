import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SIGECOM — Sistema de Gestão Comercial",
  description:
    "Sistema Inteligente de Gestão Comercial para Pequenas Lojas. Gerencie vendas, estoque e equipe em um só lugar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={inter.variable} style={{ colorScheme: "light" }}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
