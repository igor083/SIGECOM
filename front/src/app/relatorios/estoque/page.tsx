"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import AppShell from "@/components/AppShell";
import ResumoEstoque from "@/components/ResumoEstoque";
import TabelaEstoque from "@/components/TabelaEstoque";
import { useRelatorioEstoque } from "@/hooks/useRelatorioEstoque";
import { listarCategorias, type CategoriaProduto } from "@/services/produtos";
import type { OrdenacaoEstoque } from "@/services/relatoriosEstoque";
import styles from "./estoque.module.css";

const ORDENACOES: [OrdenacaoEstoque, string][] = [
  ["QUANTIDADE_ASC", "Menor estoque"],
  ["QUANTIDADE_DESC", "Maior estoque"],
];

export default function RelatorioEstoquePage() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();

  const {
    relatorio,
    categoriaId,
    setCategoriaId,
    busca,
    setBusca,
    ordenacao,
    setOrdenacao,
    loading,
    erro,
  } = useRelatorioEstoque();

  const [categorias, setCategorias] = useState<CategoriaProduto[]>([]);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.perfil !== "ADMIN")) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (!isAuthenticated || user?.perfil !== "ADMIN") return;
    let cancelado = false;
    listarCategorias()
      .then((lista) => {
        if (!cancelado) setCategorias(lista);
      })
      .catch(() => {});
    return () => {
      cancelado = true;
    };
  }, [isAuthenticated, user]);

  if (authLoading || !isAuthenticated) return null;

  return (
    <AppShell title="Relatórios — Estoque">
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label htmlFor="busca" className={styles.filterLabel}>Buscar produto</label>
          <input
            id="busca"
            className={styles.filterInput}
            type="search"
            placeholder="Nome do produto..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="categoria" className={styles.filterLabel}>Categoria</label>
          <select
            id="categoria"
            className={styles.filterSelect}
            value={categoriaId ?? ""}
            onChange={(e) => setCategoriaId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Todas</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Ordenar por</span>
          <div className={styles.toggleGroup}>
            {ORDENACOES.map(([valor, rotulo]) => (
              <button
                key={valor}
                type="button"
                onClick={() => setOrdenacao(valor)}
                className={`${styles.toggleBtn} ${ordenacao === valor ? styles.toggleBtnActive : ""}`}
              >
                {rotulo}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.filterGroup} style={{ marginLeft: "auto" }}>
          <span className={styles.filterLabel}>&nbsp;</span>
          <Link
            href="/relatorios/estoque/movimentacoes"
            className={styles.toggleBtn}
            style={{ display: "inline-flex", alignItems: "center", textDecoration: "none" }}
          >
            Ver movimentações →
          </Link>
        </div>
      </div>

      <ResumoEstoque relatorio={relatorio} loading={loading} erro={erro} />
      <TabelaEstoque relatorio={relatorio} loading={loading} erro={erro} />
    </AppShell>
  );
}
