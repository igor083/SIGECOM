"use client";

import type { CSSProperties } from "react";
import type { RelatorioReposicao } from "@/services/relatoriosReposicao";

interface ResumoReposicaoProps {
  relatorio: RelatorioReposicao | null;
  loading: boolean;
  erro: string | null;
}

function real(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ResumoReposicao({ relatorio, loading, erro }: ResumoReposicaoProps) {
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
        <p style={{ color: "var(--color-text-muted)", fontSize: 14, margin: 0 }}>
          Carregando sugestão de reposição...
        </p>
      </div>
    );
  }

  const { resumo } = relatorio;

  return (
    <div style={caixa}>
      <div style={grade}>
        <div style={{ ...cartao, background: "var(--color-primary-50)" }}>
          <span style={rotuloCartao}>Produtos para comprar</span>
          <strong style={{ fontSize: 24, color: "var(--color-primary-dark)" }}>
            {resumo.produtosParaRepor}
          </strong>
          <span style={notaCartao}>{resumo.unidadesSugeridas} unidades no total</span>
        </div>

        <div style={{ ...cartao, background: "var(--color-bg)" }}>
          {/* Produto nao tem custo cadastrado, entao o rotulo precisa dizer que o numero sai do preco de venda */}
          <span style={rotuloCartao}>Valor estimado (preço de venda)</span>
          <strong style={{ fontSize: 24, color: "var(--color-text)" }}>
            {real(resumo.valorEstimadoPrecoVenda)}
          </strong>
          <span style={notaCartao}>Estimativa, não é o custo de compra real</span>
        </div>
      </div>

      <p style={legenda}>
        Giro medido nos últimos {resumo.janelaDias} dias ({formatarData(resumo.dataInicio)} a{" "}
        {formatarData(resumo.dataFim)}), para cobrir {resumo.coberturaDias} dias de venda.
      </p>
    </div>
  );
}

function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
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
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 16,
};

const cartao: CSSProperties = {
  border: "1px solid var(--color-border)",
  borderRadius: 10,
  padding: "16px 18px",
  display: "flex",
  flexDirection: "column",
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

const notaCartao: CSSProperties = {
  fontSize: 12,
  color: "var(--color-text-muted)",
  marginTop: 4,
};

const legenda: CSSProperties = {
  margin: "14px 0 0",
  fontSize: 12,
  color: "var(--color-text-muted)",
};
