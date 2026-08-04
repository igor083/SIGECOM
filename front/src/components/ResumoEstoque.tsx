"use client";

import type { CSSProperties } from "react";
import type { RelatorioEstoque } from "@/services/relatoriosEstoque";

interface ResumoEstoqueProps {
  relatorio: RelatorioEstoque | null;
  loading: boolean;
  erro: string | null;
}

function real(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

interface Cartao {
  rotulo: string;
  valor: string;
  cor?: string;
  destaque?: boolean;
}

export default function ResumoEstoque({ relatorio, loading, erro }: ResumoEstoqueProps) {
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
        <p style={{ color: "var(--color-text-muted)", fontSize: 14, margin: 0 }}>Carregando relatório...</p>
      </div>
    );
  }

  const { resumo } = relatorio;
  const cartoes: Cartao[] = [
    { rotulo: "Produtos", valor: String(resumo.totalProdutos), destaque: true },
    { rotulo: "Em alerta", valor: String(resumo.emAlerta), cor: "var(--color-warning)" },
    { rotulo: "Em crítico", valor: String(resumo.emCritico), cor: "var(--color-error)" },
    { rotulo: "Valor em estoque", valor: real(resumo.valorTotalEstoque) },
  ];

  return (
    <div style={caixa}>
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
            <strong
              style={{
                fontSize: 24,
                color: c.cor ?? (c.destaque ? "var(--color-primary-dark)" : "var(--color-text)"),
              }}
            >
              {c.valor}
            </strong>
          </div>
        ))}
      </div>
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
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
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
