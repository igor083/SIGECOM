"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import AppShell from "@/components/AppShell";
import GradeProdutos from "@/components/GradeProdutos";
import Carrinho from "@/components/Carrinho";
import { useCarrinho } from "@/hooks/useCarrinho";
import styles from "./nova.module.css";

export default function NovaVendaPage() {
  const router = useRouter();
  const { loading, isAuthenticated } = useAuth();
  const carrinho = useCarrinho();

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace("/login");
  }, [loading, isAuthenticated, router]);

  if (loading || !isAuthenticated) return null;

  return (
    <AppShell title="PDV — Nova venda">
      <div className={styles.topo}>
        <Link href="/pdv" className={styles.voltar}>
          ← Voltar ao PDV
        </Link>
      </div>

      <div className={styles.layout}>
        {/* Coluna esquerda: catálogo em grade + busca (US-024 / SCRUM-160) */}
        <section className={styles.colunaBusca}>
          <h2 className={styles.secaoTitulo}>Produtos</h2>
          <GradeProdutos onSelecionar={carrinho.adicionarItem} />
        </section>

        {/* Coluna direita: carrinho (US-025 / US-026 / US-027) */}
        <section className={styles.colunaCarrinho}>
          <h2 className={styles.secaoTitulo}>Carrinho</h2>
          <Carrinho carrinho={carrinho} />
        </section>
      </div>
    </AppShell>
  );
}
