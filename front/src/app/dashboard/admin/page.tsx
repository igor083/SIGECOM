"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import AppShell from "@/components/AppShell";
import MetaVendaDiaria from "@/components/MetaVendaDiaria";
import DashboardDesempenho from "@/components/DashboardDesempenho";
import styles from "../dashboard.module.css";

export default function DashboardAdminPage() {
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.perfil !== "ADMIN")) {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, user, router]);

  if (loading || !user || user.perfil !== "ADMIN") {
    return (
      <div className={styles.loadingWrapper}>
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <AppShell title="Painel Administrativo">
      <DashboardDesempenho />
    </AppShell>
  );
}
