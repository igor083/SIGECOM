"use client";

// Gráficos do relatório de vendas. Componente apresentacional puro (igual ao
// ResumoVendas): recebe o relatório por prop e desenha, sem chamar API.
//
// Dois gráficos, cada um com um trabalho:
//  - Vendas por dia   → magnitude ao longo do tempo → barras de série única (azul).
//  - Por forma de pgto → identidade/composição      → rosca categórica com legenda.

import {
  Bar,
  BarChart,
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

// ── Formatação ───────────────────────────────────────────────
function real(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Eixo Y compacto: R$ 1,2 mil / R$ 3 mi — evita rótulos longos por tick.
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

// ── Formas de pagamento ──────────────────────────────────────
// Rótulo e cor são fixos por forma de pagamento (a cor segue a entidade, nunca
// a ordem/ranking). Cores: 4 primeiros slots da paleta categórica validada.
const PAGAMENTO: Record<TipoPagamento, { rotulo: string; cor: string }> = {
  DINHEIRO: { rotulo: "Dinheiro", cor: "#2a78d6" }, // azul
  PIX: { rotulo: "Pix", cor: "#008300" },           // verde
  DEBITO: { rotulo: "Débito", cor: "#e87ba4" },     // magenta
  CREDITO: { rotulo: "Crédito", cor: "#eda100" },   // amarelo
};

const COR_BARRA = "#2563eb"; // azul da identidade visual do app (série única)

export default function GraficosVendas({ relatorio, loading, erro }: GraficosVendasProps) {
  // Erros e carregamento já são comunicados pelo ResumoVendas logo acima;
  // aqui apenas não desenhamos nada para não duplicar a mensagem.
  if (erro || loading || !relatorio) return null;
  if (relatorio.quantidadeTransacoes === 0) return null;

  const dadosDia = relatorio.vendasPorDia.map((d) => ({
    dia: diaMes(d.data),
    total: d.total,
    quantidade: d.quantidade,
  }));

  const dadosPagamento = relatorio.vendasPorFormaPagamento.map((f) => ({
    tipo: f.tipoPagamento,
    rotulo: PAGAMENTO[f.tipoPagamento]?.rotulo ?? f.tipoPagamento,
    cor: PAGAMENTO[f.tipoPagamento]?.cor ?? "#94a3b8",
    total: f.total,
    quantidade: f.quantidade,
  }));

  const totalPagamentos = dadosPagamento.reduce((s, f) => s + f.total, 0);

  return (
    <div style={grade}>
      {/* ── Vendas por dia ── */}
      <section style={caixa}>
        <h3 style={titulo}>Vendas por dia</h3>
        {dadosDia.length === 0 ? (
          <p style={vazio}>Sem vendas no período.</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dadosDia} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <XAxis
                dataKey="dia"
                tick={{ fontSize: 12, fill: "#64748b" }}
                tickLine={false}
                axisLine={{ stroke: "#e2e8f0" }}
              />
              <YAxis
                width={64}
                tick={{ fontSize: 12, fill: "#64748b" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={realCompacto}
              />
              <Tooltip
                cursor={{ fill: "rgba(37,99,235,0.06)" }}
                formatter={(valor, _n, item) => [
                  `${real(Number(valor))} · ${item?.payload?.quantidade ?? 0} venda(s)`,
                  "Total",
                ]}
                labelFormatter={(l) => `Dia ${l}`}
                contentStyle={tooltipBox}
              />
              <Bar dataKey="total" fill={COR_BARRA} radius={[4, 4, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </section>

      {/* ── Por forma de pagamento ── */}
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
                stroke="#fff"
                strokeWidth={2}
              >
                {dadosPagamento.map((f) => (
                  <Cell key={f.tipo} fill={f.cor} />
                ))}
              </Pie>
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(valor) => <span style={{ fontSize: 13, color: "#475569" }}>{valor}</span>}
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

// ── Estilos (light-only, alinhado ao ResumoVendas) ───────────
const grade: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: 16,
  marginTop: 16,
};

const caixa: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 10,
  padding: "20px 24px",
  boxShadow: "0 1px 4px rgba(0,0,0,.06)",
};

const titulo: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  color: "#0f172a",
  margin: "0 0 16px",
};

const vazio: React.CSSProperties = {
  fontSize: 13,
  color: "#94a3b8",
  margin: 0,
};

const tooltipBox: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  fontSize: 13,
  boxShadow: "0 4px 12px rgba(0,0,0,.08)",
};
