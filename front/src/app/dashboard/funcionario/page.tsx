"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import AppShell from "@/components/AppShell";
import PainelFuncionario from "@/components/PainelFuncionario";
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

  // O token não carrega o nome, só o e-mail — usa a parte antes do @ como
  // tratamento informal nos textos vazios do painel.
  const primeiroNome = user.email.split("@")[0];

  return (
    <AppShell title="Painel do Funcionário">
      <PainelFuncionario funcionarioId={user.userId} primeiroNome={primeiroNome} />
    </AppShell>
  );
}
