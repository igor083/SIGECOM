"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import AppShell from "@/components/AppShell";
import Breadcrumb from "@/components/Breadcrumb";
import ResumoReposicao from "@/components/ResumoReposicao";
import TabelaReposicao from "@/components/TabelaReposicao";
import { useRelatorioReposicao } from "@/hooks/useRelatorioReposicao";
import { listarCategorias, type CategoriaProduto } from "@/services/produtos";
import styles from "../estoque.module.css";

export default function RelatorioReposicaoPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();

  // D-5: a pagina so consome o hook; quem fala com a API e o service
  const { relatorio, filtros, setFiltros, loading, erro } = useRelatorioReposicao();

  const [categorias, setCategorias] = useState<CategoriaProduto[]>([]);

  // D-2: tela de ADMIN; funcionario que digitar a URL cai no login
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
    <AppShell title="Relatórios — Sugestão de compra">
      <Breadcrumb
        trilha={[
          { label: "Relatórios", href: "/relatorios" },
          { label: "Estoque", href: "/relatorios/estoque" },
          { label: "Reposição" },
        ]}
      />

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label htmlFor="categoria" className={styles.filterLabel}>Categoria</label>
          <select
            id="categoria"
            className={styles.filterSelect}
            value={filtros.categoriaId ?? ""}
            onChange={(e) =>
              setFiltros({ categoriaId: e.target.value ? Number(e.target.value) : null })
            }
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
          <label htmlFor="janela" className={styles.filterLabel}>Analisar últimos (dias)</label>
          <input
            id="janela"
            className={styles.filterSelect}
            type="number"
            min={1}
            value={filtros.janelaDias}
            onChange={(e) => setFiltros({ janelaDias: e.target.value })}
          />
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="cobertura" className={styles.filterLabel}>Cobrir próximos (dias)</label>
          <input
            id="cobertura"
            className={styles.filterSelect}
            type="number"
            min={1}
            value={filtros.coberturaDias}
            onChange={(e) => setFiltros({ coberturaDias: e.target.value })}
          />
        </div>
      </div>

      <ResumoReposicao relatorio={relatorio} loading={loading} erro={erro} />
      <TabelaReposicao relatorio={relatorio} loading={loading} erro={erro} />
    </AppShell>
  );
}
