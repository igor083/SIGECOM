"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import AppShell from "@/components/AppShell";
import EmConstrucao from "@/components/EmConstrucao";

export default function FinanceiroPage() {
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.perfil !== "ADMIN")) {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, user, router]);

  if (loading || !isAuthenticated) return null;

  return (
    <AppShell title="Financeiro">
      <EmConstrucao
        titulo="Módulo Financeiro em desenvolvimento"
        descricao="Controle de receitas, despesas e fluxo de caixa estarão disponíveis aqui em breve."
      />
    </AppShell>
  );
}
