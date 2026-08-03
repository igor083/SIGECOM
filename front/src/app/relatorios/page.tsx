"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import AppShell from "@/components/AppShell";
import ResumoVendas from "@/components/ResumoVendas";
import GraficosVendas from "@/components/GraficosVendas";
import { useRelatorioVendas, type ModoPeriodo } from "@/hooks/useRelatorioVendas";
import { listarUsuarios, type Usuario } from "@/services/usuarios";
import styles from "./relatorios.module.css";

// Ordem e rótulos dos presets de período (o backend calcula o intervalo dos 3 primeiros).
const MODOS: [ModoPeriodo, string][] = [
  ["DIA", "Hoje"],
  ["SEMANA", "Semana"],
  ["MES", "Mês"],
  ["PERSONALIZADO", "Personalizado"],
];

export default function RelatoriosPage() {
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

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.perfil !== "ADMIN")) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, user, router]);

  // Popula o select de funcionário responsável (somente perfil FUNCIONARIO).
  useEffect(() => {
    if (!isAuthenticated || user?.perfil !== "ADMIN") return;
    let cancelado = false;
    listarUsuarios({ perfil: "FUNCIONARIO", size: 100 })
      .then((pagina) => {
        if (!cancelado) setFuncionarios(pagina.content);
      })
      .catch(() => {
        /* select fica só com "Todos" — filtro de funcionário é opcional */
      });
    return () => {
      cancelado = true;
    };
  }, [isAuthenticated, user]);

  if (authLoading || !isAuthenticated) return null;

  return (
    <AppShell title="Relatórios — Vendas por período">
      <div className={styles.filters}>
        {/* Preset de período */}
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

        {/* Datas personalizadas — só no modo PERSONALIZADO */}
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

        {/* Funcionário responsável */}
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
      </div>

      {aguardandoDatas && (
        <div className={styles.aviso} role="status">
          Selecione as datas de início e fim para gerar o relatório personalizado.
        </div>
      )}

      <ResumoVendas relatorio={relatorio} loading={loading} erro={erro} />
      <GraficosVendas relatorio={relatorio} loading={loading} erro={erro} />
    </AppShell>
  );
}
