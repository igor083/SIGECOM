"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import AppShell from "@/components/AppShell";
import BreadcrumbRelatorios from "@/components/BreadcrumbRelatorios";
import ResumoMovimentacao from "@/components/ResumoMovimentacao";
import TabelaMovimentacao from "@/components/TabelaMovimentacao";
import ChartCard from "@/components/charts/ChartCard";
import GraficoBarras, { type PontoBarra } from "@/components/charts/GraficoBarras";
import { useRelatorioMovimentacao, type ModoPeriodo } from "@/hooks/useRelatorioMovimentacao";
import { listarProdutos, listarCategorias, type Produto, type CategoriaProduto } from "@/services/produtos";
import styles from "../estoque.module.css";

const MODOS: [ModoPeriodo, string][] = [
  ["DIA", "Hoje"],
  ["SEMANA", "Semana"],
  ["MES", "Mês"],
  ["PERSONALIZADO", "Personalizado"],
];

function real(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function diaMes(iso: string): string {
  const [, mes, dia] = iso.split("-");
  return `${dia}/${mes}`;
}

function Conteudo() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, isAuthenticated } = useAuth();

  const produtoInicial = searchParams.get("produtoId");

  const {
    relatorio,
    modo,
    setModo,
    dataInicio,
    setDataInicio,
    dataFim,
    setDataFim,
    produtoId,
    setProdutoId,
    categoriaId,
    setCategoriaId,
    loading,
    erro,
    aguardandoDatas,
  } = useRelatorioMovimentacao({ produtoInicial: produtoInicial ? Number(produtoInicial) : null });

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<CategoriaProduto[]>([]);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.perfil !== "ADMIN")) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (!isAuthenticated || user?.perfil !== "ADMIN") return;
    let cancelado = false;
    Promise.all([listarProdutos({ size: 500 }), listarCategorias()])
      .then(([pagina, cats]) => {
        if (cancelado) return;
        setProdutos(pagina.content);
        setCategorias(cats);
      })
      .catch(() => {});
    return () => {
      cancelado = true;
    };
  }, [isAuthenticated, user]);

  const dadosDia: PontoBarra[] = useMemo(
    () =>
      (relatorio?.porDia ?? []).map((d) => ({
        rotulo: diaMes(d.data),
        valor: d.unidades,
        receita: d.receita,
      })),
    [relatorio],
  );

  if (authLoading || !isAuthenticated) return null;

  return (
    <AppShell title="Relatórios — Movimentações de estoque">
      <BreadcrumbRelatorios
        trilha={[
          { label: "Relatórios", href: "/relatorios" },
          { label: "Estoque", href: "/relatorios/estoque" },
          { label: "Movimentações" },
        ]}
      />
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label htmlFor="produto" className={styles.filterLabel}>Produto</label>
          <select
            id="produto"
            className={styles.filterSelect}
            value={produtoId ?? ""}
            onChange={(e) => setProdutoId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Todos</option>
            {produtos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
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
          <span className={styles.filterLabel}>Período</span>
          <div className={styles.toggleGroup}>
            {MODOS.map(([valor, rotulo]) => (
              <button
                key={valor}
                type="button"
                onClick={() => setModo(valor)}
                className={`${styles.toggleBtn} ${modo === valor ? styles.toggleBtnActive : ""}`}
              >
                {rotulo}
              </button>
            ))}
          </div>
        </div>

        {modo === "PERSONALIZADO" && (
          <>
            <div className={styles.filterGroup}>
              <label htmlFor="dt-ini" className={styles.filterLabel}>De</label>
              <input
                id="dt-ini"
                className={styles.filterInput}
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>
            <div className={styles.filterGroup}>
              <label htmlFor="dt-fim" className={styles.filterLabel}>Até</label>
              <input
                id="dt-fim"
                className={styles.filterInput}
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
          </>
        )}
      </div>

      <ResumoMovimentacao relatorio={relatorio} loading={loading} erro={erro} />

      {!erro && !aguardandoDatas && (
        <div style={{ marginBottom: 16 }}>
          <ChartCard
            titulo="Unidades por dia"
            vazio={!loading && dadosDia.length === 0}
            mensagemVazio="Sem movimentações no período."
          >
            <GraficoBarras
              dados={dadosDia}
              nomeSerie="Unidades"
              formatarTooltip={(p) => `${p.valor} un · ${real(Number(p.receita ?? 0))}`}
              rotuloTooltip={(l) => `Dia ${l}`}
            />
          </ChartCard>
        </div>
      )}

      <TabelaMovimentacao relatorio={relatorio} loading={loading} erro={erro} />
    </AppShell>
  );
}

export default function MovimentacoesPage() {
  return (
    <Suspense fallback={null}>
      <Conteudo />
    </Suspense>
  );
}
