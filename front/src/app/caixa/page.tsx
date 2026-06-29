"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import AppShell from "@/components/AppShell";
import EmConstrucao from "@/components/EmConstrucao";

export default function CaixaPage() {
  const router = useRouter();
  const { loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace("/login");
  }, [loading, isAuthenticated, router]);

  if (loading || !isAuthenticated) return null;

  return (
    <AppShell title="Caixa">
      <EmConstrucao
        titulo="Módulo de Caixa em desenvolvimento"
        descricao="Abertura, fechamento e conferência de caixa estarão disponíveis aqui em breve."
      />
    </AppShell>
  );
}
