"use client";

import type { CSSProperties } from "react";
import type { RelatorioVendas, TipoPagamento } from "@/services/relatorios";
import ChartCard from "./charts/ChartCard";
import GraficoBarras, { type PontoBarra } from "./charts/GraficoBarras";
import GraficoRosca, { type FatiaRosca } from "./charts/GraficoRosca";

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

function num(valor: unknown): number {
  return typeof valor === "number" ? valor : Number(valor ?? 0);
}

const PAGAMENTO: Record<TipoPagamento, { rotulo: string; cor: string }> = {
  DINHEIRO: { rotulo: "Dinheiro", cor: "#2a78d6" },
  PIX: { rotulo: "Pix", cor: "#008300" },
  DEBITO: { rotulo: "Débito", cor: "#e87ba4" },
  CREDITO: { rotulo: "Crédito", cor: "#eda100" },
};

export default function GraficosVendas({ relatorio, loading, erro }: GraficosVendasProps) {
  if (erro || loading || !relatorio) return null;
  if (relatorio.quantidadeTransacoes === 0) return null;

  const dadosDia: PontoBarra[] = (relatorio.vendasPorDia ?? []).map((d) => ({
    rotulo: diaMes(d.data),
    valor: d.total,
    quantidade: d.quantidade,
  }));

  const dadosPagamento: FatiaRosca[] = (relatorio.vendasPorFormaPagamento ?? []).map((f) => ({
    rotulo: PAGAMENTO[f.tipoPagamento]?.rotulo ?? f.tipoPagamento,
    valor: f.total,
    cor: PAGAMENTO[f.tipoPagamento]?.cor ?? "#94a3b8",
    quantidade: f.quantidade,
  }));

  return (
    <div style={grade}>
      <ChartCard titulo="Vendas por dia" vazio={dadosDia.length === 0} mensagemVazio="Sem vendas no período.">
        <GraficoBarras
          dados={dadosDia}
          formatarValor={real}
          formatarEixoY={realCompacto}
          nomeSerie="Total"
          formatarTooltip={(p) => `${real(p.valor)} · ${num(p.quantidade)} venda(s)`}
          rotuloTooltip={(l) => `Dia ${l}`}
        />
      </ChartCard>

      <ChartCard
        titulo="Por forma de pagamento"
        vazio={dadosPagamento.length === 0}
        mensagemVazio="Sem vendas no período."
      >
        <GraficoRosca
          dados={dadosPagamento}
          formatarTooltip={(f, pct) => `${real(f.valor)} · ${pct.toFixed(1)}% · ${num(f.quantidade)} venda(s)`}
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
