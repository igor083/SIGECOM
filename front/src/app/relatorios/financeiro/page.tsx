"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import AppShell from "@/components/AppShell";
import BreadcrumbRelatorios from "@/components/BreadcrumbRelatorios";
import PainelSaldo from "@/components/PainelSaldo";
import GraficosFinanceiro from "@/components/GraficosFinanceiro";
import { useRelatorioFinanceiro } from "@/hooks/useRelatorioFinanceiro";
import type { ModoPeriodo } from "@/hooks/useRelatorioVendas";
import { listarCategoriasFinanceiras, type CategoriaFinanceira } from "@/services/lancamentos";
import { exportarRelatorioFinanceiroXlsx } from "@/lib/exportarRelatorioFinanceiroXlsx";
import { mensagemDeErro } from "@/lib/apiError";
import styles from "./financeiro.module.css";

const MODOS: [ModoPeriodo, string][] = [
  ["DIA", "Hoje"],
  ["SEMANA", "Semana"],
  ["MES", "Mês"],
  ["PERSONALIZADO", "Personalizado"],
];

export default function RelatorioFinanceiroPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();

  const {
    relatorio,
    modo,
    setModo,
    dataInicio,
    setDataInicio,
    dataFim,
    setDataFim,
    categoriaId,
    setCategoriaId,
    loading,
    erro,
    aguardandoDatas,
  } = useRelatorioFinanceiro("MES");

  const [categorias, setCategorias] = useState<CategoriaFinanceira[]>([]);
  const [exportando, setExportando] = useState(false);
  const [erroExport, setErroExport] = useState<string | null>(null);

  const rotuloPeriodo = MODOS.find(([v]) => v === modo)?.[1] ?? "";
  const categoriaSelecionada =
    categoriaId != null
      ? categorias.find((c) => c.id === categoriaId)?.nome ?? null
      : null;
  const podeExportar =
    !!relatorio && !loading && !erro && (relatorio.porCategoria?.length ?? 0) > 0;

  async function handleExportar() {
    if (!relatorio) return;
    setExportando(true);
    setErroExport(null);
    try {
      await exportarRelatorioFinanceiroXlsx({
        relatorio,
        categoriaNome: categoriaSelecionada,
        periodoLabel: rotuloPeriodo,
      });
    } catch (err) {
      setErroExport(mensagemDeErro(err, "Não foi possível exportar a planilha."));
    } finally {
      setExportando(false);
    }
  }

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.perfil !== "ADMIN")) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (!isAuthenticated || user?.perfil !== "ADMIN") return;
    let cancelado = false;
    listarCategoriasFinanceiras()
      .then((lista) => {
        if (!cancelado) setCategorias(lista);
      })
      .catch(() => {});
    return () => {
      cancelado = true;
    };
  }, [isAuthenticated, user]);

  if (authLoading || !isAuthenticated) return null;

  // D-5: camada de página só monta UI e delega lógica ao hook
  return (
    <AppShell title="Relatórios — Financeiro por período">
      <BreadcrumbRelatorios
        trilha={[
          { label: "Relatórios", href: "/relatorios" },
          { label: "Financeiro" },
        ]}
      />
      <div className={styles.filters}>
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

        <div className={styles.filterGroup}>
          <label htmlFor="cat" className={styles.filterLabel}>Categoria</label>
          <select
            id="cat"
            className={styles.filterSelect}
            value={categoriaId ?? ""}
            onChange={(e) =>
              setCategoriaId(e.target.value ? Number(e.target.value) : null)
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

        <div className={styles.filterGroup} style={{ marginLeft: "auto" }}>
          <span className={styles.filterLabel}>&nbsp;</span>
          <button
            type="button"
            className={styles.exportBtn}
            onClick={handleExportar}
            disabled={!podeExportar || exportando}
            title={
              podeExportar
                ? "Exportar relatório financeiro para planilha (.xlsx)"
                : "Gere um relatório com lançamentos para exportar"
            }
          >
            {exportando ? "Exportando…" : "Exportar XLSX"}
          </button>
        </div>
      </div>

      {aguardandoDatas && (
        <div className={styles.aviso} role="status">
          Selecione as datas de início e fim para gerar o relatório personalizado.
        </div>
      )}

      {erroExport && (
        <div className={styles.avisoErro} role="alert">
          {erroExport}
        </div>
      )}

      <PainelSaldo saldo={relatorio} loading={loading} erro={erro} />
      <GraficosFinanceiro relatorio={relatorio} loading={loading} erro={erro} />
    </AppShell>
  );
}
