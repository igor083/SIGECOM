"use client";

import { useState } from "react";
import { useDashboardDesempenho } from "@/hooks/useDashboardDesempenho";
import { useMetaVendaDiaria } from "@/hooks/useMetaVendaDiaria";
import type { PeriodoRelatorio } from "@/services/dashboard";
import ChartCard from "@/components/charts/ChartCard";
import GraficoBarras from "@/components/charts/GraficoBarras";
import GraficoRosca from "@/components/charts/GraficoRosca";
import styles from "./DashboardDesempenho.module.css";

const CORES_PAGAMENTO: Record<string, string> = {
  PIX: "#3b82f6",
  CREDITO: "#10b981",
  DEBITO: "#f59e0b",
  DINHEIRO: "#8b5cf6",
};

const LABEL_PAGAMENTO: Record<string, string> = {
  PIX: "PIX",
  CREDITO: "Cartão Crédito",
  DEBITO: "Cartão Débito",
  DINHEIRO: "Dinheiro",
};

const PERIODOS: { valor: PeriodoRelatorio; label: string }[] = [
  { valor: "DIA", label: "Dia" },
  { valor: "SEMANA", label: "Semana" },
  { valor: "MES", label: "Mês" },
];

function real(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function dataCurta(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

export default function DashboardDesempenho() {
  const { dados, carregando, erro, periodo, setPeriodo } = useDashboardDesempenho("SEMANA");
  const meta = useMetaVendaDiaria();
  const [metaAberta, setMetaAberta] = useState(false);

  if (erro) {
    return <p className={styles.erro}>{erro}</p>;
  }

  if (carregando || !dados) {
    return <p className={styles.loading}>Carregando dashboard...</p>;
  }

  const barrasVendas = dados.vendasPorDia.map((v) => ({
    rotulo: dataCurta(v.data),
    valor: v.total,
  }));

  const roscaPagamento = dados.vendasPorFormaPagamento.map((f) => ({
    rotulo: LABEL_PAGAMENTO[f.tipo] ?? f.tipo,
    valor: f.total,
    cor: CORES_PAGAMENTO[f.tipo] ?? "#94a3b8",
  }));

  const barrasFinanceiro = [
    { rotulo: "Receitas", valor: dados.totalReceitas, cor: "#10b981" },
    { rotulo: "Despesas", valor: dados.totalDespesas, cor: "#ef4444" },
    { rotulo: "Saldo", valor: dados.saldoFinanceiro, cor: "#3b82f6" },
  ];

  return (
    <div>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.metaBtn} onClick={() => setMetaAberta(true)}>
            Meta Diária
          </button>
        </div>
        <div className={styles.filtro}>
          {PERIODOS.map((p) => (
            <button
              key={p.valor}
              className={`${styles.filtroBtn} ${periodo === p.valor ? styles.filtroBtnAtivo : ""}`}
              onClick={() => setPeriodo(p.valor)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.kpis}>
        <KpiCard label="Vendas" valor={real(dados.totalVendas)} destaque />
        <KpiCard label="Transações" valor={String(dados.quantidadeTransacoes)} />
        <KpiCard label="Ticket Médio" valor={real(dados.ticketMedio)} />
        <KpiCard label="Itens em Alerta" valor={String(dados.itensEmAlerta)} alerta={dados.itensEmAlerta > 0} />
      </div>

      <div className={styles.charts}>
        <ChartCard titulo="Vendas por Dia">
          {barrasVendas.length > 0 ? (
            <GraficoBarras
              dados={barrasVendas}
              formatarValor={real}
              formatarEixoY={(v) => `R$${(v / 1000).toFixed(0)}k`}
              altura={220}
            />
          ) : (
            <div className={styles.chartPlaceholder}>
              <GraficoBarras
                dados={[
                  { rotulo: "Seg", valor: 0 },
                  { rotulo: "Ter", valor: 0 },
                  { rotulo: "Qua", valor: 0 },
                  { rotulo: "Qui", valor: 0 },
                  { rotulo: "Sex", valor: 0 },
                  { rotulo: "Sáb", valor: 0 },
                  { rotulo: "Dom", valor: 0 },
                ]}
                formatarValor={real}
                altura={220}
              />
              <p className={styles.placeholderMsg}>Nenhuma venda no período</p>
            </div>
          )}
        </ChartCard>

        <ChartCard titulo="Vendas por Forma de Pagamento">
          {roscaPagamento.length > 0 ? (
            <GraficoRosca
              dados={roscaPagamento}
              formatarTooltip={(f, pct) => `${real(f.valor)} (${pct.toFixed(0)}%)`}
              altura={220}
            />
          ) : (
            <div className={styles.chartPlaceholder}>
              <GraficoRosca
                dados={[{ rotulo: "Sem dados", valor: 1, cor: "var(--color-border, #334155)" }]}
                altura={220}
                legenda={false}
              />
              <p className={styles.placeholderMsg}>Nenhuma venda no período</p>
            </div>
          )}
        </ChartCard>

        <ChartCard titulo="Resumo Financeiro">
          <div className={styles.barrasFinanceiro}>
            {barrasFinanceiro.map((b) => (
              <div key={b.rotulo} className={styles.barraFinItem}>
                <span className={styles.barraFinLabel}>{b.rotulo}</span>
                <div className={styles.barraFinTrack}>
                  <div
                    className={styles.barraFinFill}
                    style={{
                      width: `${Math.min(100, Math.max(5, (Math.abs(b.valor) / Math.max(dados.totalReceitas, 1)) * 100))}%`,
                      backgroundColor: b.cor,
                    }}
                  />
                </div>
                <span className={styles.barraFinValor}>{real(b.valor)}</span>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard titulo="Top 5 Produtos">
          {dados.topProdutos.length > 0 ? (
            <table className={styles.tabela}>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Categoria</th>
                  <th style={{ textAlign: "right" }}>Qtd</th>
                  <th style={{ textAlign: "right" }}>Receita</th>
                </tr>
              </thead>
              <tbody>
                {dados.topProdutos.map((p) => (
                  <tr key={p.produtoId}>
                    <td>{p.nome}</td>
                    <td className={styles.tabelaMuted}>{p.categoria}</td>
                    <td style={{ textAlign: "right" }}>{p.unidades}</td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>{real(p.receita)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className={styles.tabelaVazia}>
              <table className={styles.tabela}>
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Categoria</th>
                    <th style={{ textAlign: "right" }}>Qtd</th>
                    <th style={{ textAlign: "right" }}>Receita</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td colSpan={4} className={styles.placeholderMsg}>Nenhuma venda no período</td></tr>
                </tbody>
              </table>
            </div>
          )}
        </ChartCard>
      </div>

      {metaAberta && <ModalMeta meta={meta} onClose={() => setMetaAberta(false)} />}
    </div>
  );
}

function KpiCard({ label, valor, destaque, alerta }: {
  label: string;
  valor: string;
  destaque?: boolean;
  alerta?: boolean;
}) {
  return (
    <div className={`${styles.kpi} ${destaque ? styles.kpiDestaque : ""}`}>
      <span className={styles.kpiLabel}>{label}</span>
      <span className={`${styles.kpiValor} ${alerta ? styles.kpiAlerta : ""}`}>{valor}</span>
    </div>
  );
}

function ModalMeta({ meta, onClose }: {
  meta: { dados: { metaDia: number; realizadoHoje: number; percentual: number; noBazul: boolean } | null; carregando: boolean; erro: string | null };
  onClose: () => void;
}) {
  const d = meta.dados;
  const barraLargura = d ? Math.min(d.percentual, 100) : 0;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitulo}>Meta Diária</h3>
          <button className={styles.modalFechar} onClick={onClose} aria-label="Fechar">&times;</button>
        </div>

        {meta.carregando && <p className={styles.loading}>Carregando...</p>}
        {meta.erro && <p className={styles.erro}>{meta.erro}</p>}

        {d && (
          <div className={styles.modalBody}>
            <div className={styles.modalBadge} data-azul={d.noBazul}>
              {d.noBazul ? "No azul!" : "Abaixo da meta"}
            </div>

            <div className={styles.modalPercentual} data-azul={d.noBazul}>
              {d.percentual.toFixed(1)}%
            </div>

            <div className={styles.modalBarra}>
              <div
                className={styles.modalBarraFill}
                data-azul={d.noBazul}
                style={{ width: `${barraLargura}%` }}
              />
            </div>

            <div className={styles.modalValores}>
              <div className={styles.modalValorBloco}>
                <span className={styles.modalValorLabel}>Realizado Hoje</span>
                <span className={styles.modalValorNum}>{real(d.realizadoHoje)}</span>
              </div>
              <div className={styles.modalSep} />
              <div className={styles.modalValorBloco}>
                <span className={styles.modalValorLabel}>Meta</span>
                <span className={styles.modalValorNum}>{real(d.metaDia)}</span>
              </div>
              <div className={styles.modalSep} />
              <div className={styles.modalValorBloco}>
                <span className={styles.modalValorLabel}>Faltam</span>
                <span className={styles.modalValorNum}>
                  {d.noBazul ? "—" : real(d.metaDia - d.realizadoHoje)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
