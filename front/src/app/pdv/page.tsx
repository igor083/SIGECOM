"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import AppShell from "@/components/AppShell";
import EmConstrucao from "@/components/EmConstrucao";

export default function PdvPage() {
  const router = useRouter();
  const { loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace("/login");
  }, [loading, isAuthenticated, router]);

  if (loading || !isAuthenticated) return null;

  return (
    <AppShell title="PDV">
      <EmConstrucao
        titulo="Ponto de Venda em desenvolvimento"
        descricao="O módulo de PDV estará disponível em breve. Aqui você poderá registrar vendas, aplicar descontos e emitir cupons."
      />
    </AppShell>
  );
}
