"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import AppShell from "@/components/AppShell";
import styles from "./estoque.module.css";

export default function EstoquePage() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated || user?.perfil !== "ADMIN") {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, user, router]);

  if (loading || !isAuthenticated || user?.perfil !== "ADMIN") {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Verificando permissões...</p>
      </div>
    );
  }

  return (
    <AppShell title="Gerenciamento / Estoque">
      <div className={styles.intro}>
        <p>Selecione o módulo que deseja acessar</p>
      </div>

      <div className={styles.cards}>
        <Link href="/produtos" className={styles.card}>
          <div className={styles.cardIcon}>📦</div>
          <div className={styles.cardContent}>
            <h2>Gerenciamento de Produtos</h2>
            <p>Cadastre, edite, pesquise e ajuste o estoque dos produtos do catálogo</p>
          </div>
          <div className={styles.cardArrow}>→</div>
        </Link>

        <Link href="/estoque/categorias" className={styles.card}>
          <div className={styles.cardIcon}>🏷️</div>
          <div className={styles.cardContent}>
            <h2>Tipos de Produtos</h2>
            <p>Crie e organize as categorias utilizadas para classificar os produtos</p>
          </div>
          <div className={styles.cardArrow}>→</div>
        </Link>
      </div>
    </AppShell>
  );
}
