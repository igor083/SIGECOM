"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import AppShell from "@/components/AppShell";
import BuscaProduto from "@/components/BuscaProduto";
import Carrinho from "@/components/Carrinho";
import { useCarrinho } from "@/hooks/useCarrinho";
import styles from "./pdv.module.css";

export default function PdvPage() {
  const router = useRouter();
  const { loading, isAuthenticated } = useAuth();
  const carrinho = useCarrinho();

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace("/login");
  }, [loading, isAuthenticated, router]);

  if (loading || !isAuthenticated) return null;

  return (
    <AppShell title="PDV — Ponto de Venda">
      <div className={styles.layout}>
        {/* Coluna esquerda: busca de produtos (US-024) */}
        <section className={styles.colunaBusca}>
          <h2 className={styles.secaoTitulo}>Buscar produto</h2>
          {/* onSelecionar conecta BuscaProduto ao carrinho (CA-1) */}
          <BuscaProduto onSelecionar={carrinho.adicionarItem} />
        </section>

        {/* Coluna direita: carrinho (US-025) */}
        <section className={styles.colunaCarrinho}>
          <h2 className={styles.secaoTitulo}>Carrinho</h2>
          <Carrinho carrinho={carrinho} />
        </section>
      </div>
    </AppShell>
  );
}
