"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import AppShell from "@/components/AppShell";
import EmConstrucao from "@/components/EmConstrucao";
import MetaVendaDiaria from "@/components/MetaVendaDiaria";
import styles from "../dashboard.module.css";

export default function DashboardFuncionarioPage() {
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.perfil !== "FUNCIONARIO")) {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, user, router]);

  if (loading || !user || user.perfil !== "FUNCIONARIO") {
    return (
      <div className={styles.loadingWrapper}>
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <AppShell title="Painel do Funcionário">
      <MetaVendaDiaria />
      <EmConstrucao
        titulo="Dashboard em desenvolvimento"
        descricao="Os demais indicadores e resumos do dia serão exibidos aqui quando os módulos de PDV e caixa estiverem integrados à API."
      />
    </AppShell>
  );
}
