"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { RelatorioVendas, TipoPagamento } from "@/services/relatorios";

interface GraficosVendasProps {
  relatorio: RelatorioVendas | null;
  loading: boolean;
  erro: string | null;
}

function real(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function realCompacto(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 1,
  });
}

function diaMes(iso: string): string {
  const [, mes, dia] = iso.split("-");
  return `${dia}/${mes}`;
}

const PAGAMENTO: Record<TipoPagamento, { rotulo: string; cor: string }> = {
  DINHEIRO: { rotulo: "Dinheiro", cor: "#2a78d6" },
  PIX: { rotulo: "Pix", cor: "#008300" },
  DEBITO: { rotulo: "Débito", cor: "#e87ba4" },
  CREDITO: { rotulo: "Crédito", cor: "#eda100" },
};

interface TokensGrafico {
  texto: string;
  eixo: string;
  grade: string;
  primaria: string;
  card: string;
}

const CURSOR = "rgba(37,99,235,0.08)";

const TOKENS_PADRAO: TokensGrafico = {
  texto: "#475569",
  eixo: "#e2e8f0",
  grade: "#f1f5f9",
  primaria: "#2563eb",
  card: "#ffffff",
};

function useTokensGrafico(): TokensGrafico {
  const [tokens, setTokens] = useState<TokensGrafico>(TOKENS_PADRAO);
  useEffect(() => {
    const ler = () => {
      const cs = getComputedStyle(document.documentElement);
      const v = (nome: string, fallback: string) => cs.getPropertyValue(nome).trim() || fallback;
      setTokens({
        texto: v("--color-text-secondary", TOKENS_PADRAO.texto),
        eixo: v("--color-border", TOKENS_PADRAO.eixo),
        grade: v("--color-border", TOKENS_PADRAO.grade),
        primaria: v("--color-primary", TOKENS_PADRAO.primaria),
        card: v("--color-bg-card", TOKENS_PADRAO.card),
      });
    };
    ler();
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", ler);
    return () => mq.removeEventListener("change", ler);
  }, []);
  return tokens;
}

export default function GraficosVendas({ relatorio, loading, erro }: GraficosVendasProps) {
  const t = useTokensGrafico();

  if (erro || loading || !relatorio) return null;
  if (relatorio.quantidadeTransacoes === 0) return null;

  const dadosDia = (relatorio.vendasPorDia ?? []).map((d) => ({
    dia: diaMes(d.data),
    total: d.total,
    quantidade: d.quantidade,
  }));

  const dadosPagamento = (relatorio.vendasPorFormaPagamento ?? []).map((f) => ({
    tipo: f.tipoPagamento,
    rotulo: PAGAMENTO[f.tipoPagamento]?.rotulo ?? f.tipoPagamento,
    cor: PAGAMENTO[f.tipoPagamento]?.cor ?? "#94a3b8",
    total: f.total,
    quantidade: f.quantidade,
  }));

  const totalPagamentos = dadosPagamento.reduce((s, f) => s + f.total, 0);

  return (
    <div style={grade}>
      <section style={caixa}>
        <h3 style={titulo}>Vendas por dia</h3>
        {dadosDia.length === 0 ? (
          <p style={vazio}>Sem vendas no período.</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dadosDia} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={t.grade} />
              <XAxis
                dataKey="dia"
                tick={{ fontSize: 12, fill: t.texto }}
                tickLine={false}
                axisLine={{ stroke: t.eixo }}
              />
              <YAxis
                width={64}
                tick={{ fontSize: 12, fill: t.texto }}
                tickLine={false}
                axisLine={false}
                tickFormatter={realCompacto}
              />
              <Tooltip
                cursor={{ fill: CURSOR }}
                formatter={(valor, _n, item) => [
                  `${real(Number(valor))} · ${item?.payload?.quantidade ?? 0} venda(s)`,
                  "Total",
                ]}
                labelFormatter={(l) => `Dia ${l}`}
                contentStyle={tooltipBox}
              />
              <Bar dataKey="total" fill={t.primaria} radius={[4, 4, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </section>

      <section style={caixa}>
        <h3 style={titulo}>Por forma de pagamento</h3>
        {dadosPagamento.length === 0 ? (
          <p style={vazio}>Sem vendas no período.</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={dadosPagamento}
                dataKey="total"
                nameKey="rotulo"
                cx="50%"
                cy="50%"
                innerRadius={58}
                outerRadius={92}
                paddingAngle={2}
                stroke={t.card}
                strokeWidth={2}
              >
                {dadosPagamento.map((f) => (
                  <Cell key={f.tipo} fill={f.cor} />
                ))}
              </Pie>
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(valor) => (
                  <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{valor}</span>
                )}
              />
              <Tooltip
                formatter={(valor, _n, item) => {
                  const v = Number(valor);
                  const pct = totalPagamentos > 0 ? (v / totalPagamentos) * 100 : 0;
                  return [
                    `${real(v)} · ${pct.toFixed(1)}% · ${item?.payload?.quantidade ?? 0} venda(s)`,
                    item?.payload?.rotulo ?? "",
                  ];
                }}
                contentStyle={tooltipBox}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </section>
    </div>
  );
}

const grade: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: 16,
  marginTop: 16,
};

const caixa: React.CSSProperties = {
  background: "var(--color-bg-card)",
  border: "1px solid var(--color-border)",
  borderRadius: 10,
  padding: "20px 24px",
  boxShadow: "var(--shadow-sm)",
};

const titulo: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  color: "var(--color-text)",
  margin: "0 0 16px",
};

const vazio: React.CSSProperties = {
  fontSize: 13,
  color: "var(--color-text-muted)",
  margin: 0,
};

const tooltipBox: React.CSSProperties = {
  background: "var(--color-bg-card)",
  border: "1px solid var(--color-border)",
  borderRadius: 8,
  fontSize: 13,
  color: "var(--color-text)",
  boxShadow: "var(--shadow-md)",
};
