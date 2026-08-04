"use client";

import type { CSSProperties } from "react";
import type { RelatorioMovimentacao } from "@/services/relatoriosMovimentacao";

interface ResumoMovimentacaoProps {
  relatorio: RelatorioMovimentacao | null;
  loading: boolean;
  erro: string | null;
}

function real(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function dataBr(iso: string): string {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return new Date(ano, mes - 1, dia).toLocaleDateString("pt-BR");
}

export default function ResumoMovimentacao({ relatorio, loading, erro }: ResumoMovimentacaoProps) {
  if (erro) {
    return (
      <div style={caixa}>
        <p style={{ color: "var(--color-error)", fontSize: 14, margin: 0 }}>{erro}</p>
      </div>
    );
  }

  if (loading || !relatorio) {
    return (
      <div style={caixa}>
        <p style={{ color: "var(--color-text-muted)", fontSize: 14, margin: 0 }}>Carregando movimentações...</p>
      </div>
    );
  }

  const { resumo } = relatorio;
  const cartoes = [
    { rotulo: "Unidades vendidas", valor: String(resumo.totalUnidades), destaque: true },
    { rotulo: "Receita", valor: real(resumo.totalReceita) },
    { rotulo: "Produtos distintos", valor: String(resumo.produtosDistintos) },
  ];

  return (
    <div style={caixa}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--color-text)", margin: 0 }}>
          Movimentações de saída
        </h2>
        <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
          {dataBr(relatorio.dataInicio)} — {dataBr(relatorio.dataFim)}
        </span>
      </div>

      <div style={grade}>
        {cartoes.map((c) => (
          <div
            key={c.rotulo}
            style={{
              border: "1px solid var(--color-border)",
              borderRadius: 10,
              padding: "16px 18px",
              background: c.destaque ? "var(--color-primary-50)" : "var(--color-bg)",
            }}
          >
            <span style={rotuloCartao}>{c.rotulo}</span>
            <strong style={{ fontSize: 24, color: c.destaque ? "var(--color-primary-dark)" : "var(--color-text)" }}>
              {c.valor}
            </strong>
          </div>
        ))}
      </div>

      {resumo.totalUnidades === 0 && (
        <p style={{ marginTop: 14, marginBottom: 0, fontSize: 13, color: "var(--color-text-muted)" }}>
          Nenhuma movimentação no período/filtros selecionados.
        </p>
      )}
    </div>
  );
}

const caixa: CSSProperties = {
  background: "var(--color-bg-card)",
  border: "1px solid var(--color-border)",
  borderRadius: 10,
  padding: "20px 24px",
  boxShadow: "var(--shadow-sm)",
  marginBottom: 16,
};

const grade: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 16,
};

const rotuloCartao: CSSProperties = {
  display: "block",
  fontSize: 12,
  color: "var(--color-text-secondary)",
  marginBottom: 6,
  textTransform: "uppercase",
  letterSpacing: "0.03em",
  fontWeight: 600,
};
