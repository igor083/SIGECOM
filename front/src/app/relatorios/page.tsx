"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import AppShell from "@/components/AppShell";
import EmConstrucao from "@/components/EmConstrucao";

export default function RelatoriosPage() {
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.perfil !== "ADMIN")) {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, user, router]);

  if (loading || !isAuthenticated) return null;

  return (
    <AppShell title="Relatórios">
      <EmConstrucao
        titulo="Módulo de Relatórios em desenvolvimento"
        descricao="Relatórios de vendas, estoque e desempenho estarão disponíveis aqui em breve."
      />
    </AppShell>
  );
}
