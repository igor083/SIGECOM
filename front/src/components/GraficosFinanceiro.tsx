"use client";

import type { CSSProperties } from "react";
import type { RelatorioFinanceiro } from "@/services/relatorios";
import ChartCard from "./charts/ChartCard";
import GraficoBarras, { type PontoBarra } from "./charts/GraficoBarras";

interface GraficosFinanceiroProps {
  relatorio: RelatorioFinanceiro | null;
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

export default function GraficosFinanceiro({ relatorio, loading, erro }: GraficosFinanceiroProps) {
  if (erro || loading || !relatorio) return null;
  if (relatorio.porCategoria.length === 0) return null;

  const despesas: PontoBarra[] = relatorio.porCategoria
    .filter((c) => c.tipo === "DESPESA")
    .sort((a, b) => b.total - a.total)
    .map((c) => ({ rotulo: c.categoriaNome, valor: c.total }));

  const receitas: PontoBarra[] = relatorio.porCategoria
    .filter((c) => c.tipo === "RECEITA")
    .sort((a, b) => b.total - a.total)
    .map((c) => ({ rotulo: c.categoriaNome, valor: c.total }));

  return (
    <div style={grade}>
      <ChartCard
        titulo="Despesas por categoria"
        vazio={despesas.length === 0}
        mensagemVazio="Sem despesas no período."
      >
        <GraficoBarras
          dados={despesas}
          cor="#dc2626"
          formatarValor={real}
          formatarEixoY={realCompacto}
          nomeSerie="Total"
          formatarTooltip={(p) => real(p.valor)}
          rotuloTooltip={(l) => l}
        />
      </ChartCard>

      <ChartCard
        titulo="Receitas por categoria"
        vazio={receitas.length === 0}
        mensagemVazio="Sem receitas no período."
      >
        <GraficoBarras
          dados={receitas}
          cor="#16a34a"
          formatarValor={real}
          formatarEixoY={realCompacto}
          nomeSerie="Total"
          formatarTooltip={(p) => real(p.valor)}
          rotuloTooltip={(l) => l}
        />
      </ChartCard>
    </div>
  );
}

const grade: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: 16,
  marginTop: 16,
};
