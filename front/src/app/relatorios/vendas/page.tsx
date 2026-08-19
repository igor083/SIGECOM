"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import AppShell from "@/components/AppShell";
import Breadcrumb from "@/components/Breadcrumb";
import ResumoVendas from "@/components/ResumoVendas";
import GraficosVendas from "@/components/GraficosVendas";
import { useRelatorioVendas, type ModoPeriodo } from "@/hooks/useRelatorioVendas";
import { listarUsuarios, type Usuario } from "@/services/usuarios";
import { exportarRelatorioXlsx } from "@/lib/exportarRelatorioXlsx";
import { mensagemDeErro } from "@/lib/apiError";
import styles from "./vendas.module.css";

const MODOS: [ModoPeriodo, string][] = [
  ["DIA", "Hoje"],
  ["SEMANA", "Semana"],
  ["MES", "Mês"],
  ["PERSONALIZADO", "Personalizado"],
];

export default function RelatorioVendasPage() {
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
    funcionarioId,
    setFuncionarioId,
    loading,
    erro,
    aguardandoDatas,
  } = useRelatorioVendas("MES");

  const [funcionarios, setFuncionarios] = useState<Usuario[]>([]);
  const [exportando, setExportando] = useState(false);
  const [erroExport, setErroExport] = useState<string | null>(null);

  const rotuloPeriodo = MODOS.find(([v]) => v === modo)?.[1] ?? "";
  const funcionarioNome =
    funcionarioId != null
      ? funcionarios.find((f) => f.id === funcionarioId)?.nome ?? `#${funcionarioId}`
      : null;
  const podeExportar =
    !!relatorio && !loading && !erro && relatorio.quantidadeTransacoes > 0;

  async function handleExportar() {
    if (!relatorio) return;
    setExportando(true);
    setErroExport(null);
    try {
      await exportarRelatorioXlsx({
        relatorio,
        funcionarioId,
        funcionarioNome,
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
    listarUsuarios({ perfil: "FUNCIONARIO", size: 100 })
      .then((pagina) => {
        if (!cancelado) setFuncionarios(pagina.content);
      })
      .catch(() => {});
    return () => {
      cancelado = true;
    };
  }, [isAuthenticated, user]);

  if (authLoading || !isAuthenticated) return null;

  return (
    <AppShell title="Relatórios — Vendas por período">
      <Breadcrumb
        trilha={[
          { label: "Relatórios", href: "/relatorios" },
          { label: "Vendas" },
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
          <label htmlFor="func" className={styles.filterLabel}>Funcionário</label>
          <select
            id="func"
            className={styles.filterSelect}
            value={funcionarioId ?? ""}
            onChange={(e) =>
              setFuncionarioId(e.target.value ? Number(e.target.value) : null)
            }
          >
            <option value="">Todos</option>
            {funcionarios.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome}
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
                ? "Exportar relatório detalhado para planilha (.xlsx)"
                : "Gere um relatório com vendas para exportar"
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

      <ResumoVendas relatorio={relatorio} loading={loading} erro={erro} />
      <GraficosVendas relatorio={relatorio} loading={loading} erro={erro} />
    </AppShell>
  );
}
