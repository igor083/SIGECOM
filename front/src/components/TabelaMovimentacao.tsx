"use client";

import type { CSSProperties } from "react";
import type { RelatorioMovimentacao } from "@/services/relatoriosMovimentacao";

interface TabelaMovimentacaoProps {
  relatorio: RelatorioMovimentacao | null;
  loading: boolean;
  erro: string | null;
}

const COLUNAS = "1fr 130px 150px 110px";

function real(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function TabelaMovimentacao({ relatorio, loading, erro }: TabelaMovimentacaoProps) {
  const itens = relatorio?.porProduto ?? [];

  return (
    <div style={caixa}>
      <div style={cabecalho}>
        <span>Produto / Categoria</span>
        <span style={{ textAlign: "right" }}>Unidades vendidas</span>
        <span style={{ textAlign: "right" }}>Receita</span>
        <span style={{ textAlign: "right" }}>Vendas</span>
      </div>

      {erro && <div style={mensagem("var(--color-error)")}>{erro}</div>}

      {!erro && loading && <div style={mensagem()}>Carregando...</div>}

      {!erro && !loading && itens.length === 0 && (
        <div style={mensagem()}>Nenhuma movimentação no período/filtros selecionados.</div>
      )}

      {!erro && !loading &&
        itens.map((item, idx) => (
          <div
            key={item.produtoId}
            style={{
              display: "grid",
              gridTemplateColumns: COLUNAS,
              padding: "14px 20px",
              alignItems: "center",
              fontSize: 14,
              borderBottom: idx < itens.length - 1 ? "1px solid var(--color-border)" : "none",
            }}
          >
            <div>
              <div style={{ fontWeight: 500, color: "var(--color-text)" }}>{item.produtoNome}</div>
              <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 2 }}>
                {item.categoriaNome}
              </div>
            </div>
            <div style={{ textAlign: "right", fontWeight: 600, color: "var(--color-text)" }}>
              {item.unidades}
            </div>
            <div style={{ textAlign: "right", color: "var(--color-text)" }}>{real(item.receita)}</div>
            <div style={{ textAlign: "right", color: "var(--color-text-secondary)" }}>{item.numVendas}</div>
          </div>
        ))}
    </div>
  );
}

const caixa: CSSProperties = {
  background: "var(--color-bg-card)",
  border: "1px solid var(--color-border)",
  borderRadius: 10,
  boxShadow: "var(--shadow-sm)",
  overflow: "hidden",
};

const cabecalho: CSSProperties = {
  display: "grid",
  gridTemplateColumns: COLUNAS,
  padding: "12px 20px",
  borderBottom: "1px solid var(--color-border)",
  fontSize: 12,
  fontWeight: 600,
  color: "var(--color-text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

function mensagem(cor = "var(--color-text-muted)"): CSSProperties {
  return { padding: "40px 20px", textAlign: "center", color: cor, fontSize: 14 };
}
