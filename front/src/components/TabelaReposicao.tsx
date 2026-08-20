"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import type { ItemReposicao, RelatorioReposicao } from "@/services/relatoriosReposicao";
import { STATUS_META } from "@/lib/statusEstoque";

interface TabelaReposicaoProps {
  relatorio: RelatorioReposicao | null;
  loading: boolean;
  erro: string | null;
}

const COLUNAS = "1fr 100px 90px 130px 120px 140px";

function real(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function Badge({ item }: { item: ItemReposicao }) {
  const meta = STATUS_META[item.status];
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: meta.cor,
        background: meta.fundo,
        borderRadius: 999,
        padding: "2px 8px",
        marginLeft: 8,
      }}
    >
      {meta.rotulo}
    </span>
  );
}

export default function TabelaReposicao({ relatorio, loading, erro }: TabelaReposicaoProps) {
  const itens = relatorio?.itens ?? [];

  return (
    <div style={caixa}>
      <div style={cabecalho}>
        <span>Produto / Categoria</span>
        <span style={{ textAlign: "right" }}>Estoque</span>
        <span style={{ textAlign: "right" }}>Mínimo</span>
        <span style={{ textAlign: "right" }}>Vendido no período</span>
        <span style={{ textAlign: "right" }}>Comprar</span>
        <span style={{ textAlign: "right" }}>Valor estimado</span>
      </div>

      {erro && <div style={mensagem("var(--color-error)")}>{erro}</div>}

      {!erro && loading && <div style={mensagem()}>Carregando...</div>}

      {!erro && !loading && itens.length === 0 && (
        <div style={mensagem()}>Nenhum produto precisa de reposição com os filtros selecionados.</div>
      )}

      {!erro && !loading &&
        itens.map((item, idx) => {
          const meta = STATUS_META[item.status];
          const destacado = item.status !== "NORMAL";
          return (
            <div
              key={item.produtoId}
              style={{
                display: "grid",
                gridTemplateColumns: COLUNAS,
                padding: "14px 20px",
                alignItems: "center",
                fontSize: 14,
                borderBottom: idx < itens.length - 1 ? "1px solid var(--color-border)" : "none",
                borderLeft: destacado ? `3px solid ${meta.cor}` : "3px solid transparent",
                background: destacado ? meta.fundo : "transparent",
              }}
            >
              <div>
                <Link
                  href={`/relatorios/estoque/movimentacoes?produtoId=${item.produtoId}`}
                  style={{ fontWeight: 500, color: "var(--color-primary)", textDecoration: "none" }}
                  title="Ver movimentações deste produto"
                >
                  {item.nome}
                </Link>
                <Badge item={item} />
                <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 2 }}>
                  {item.categoriaNome}
                </div>
              </div>
              <div style={{ textAlign: "right", fontWeight: 600, color: "var(--color-text)" }}>
                {item.qtdEstoque}
              </div>
              <div style={{ textAlign: "right", color: "var(--color-text-secondary)" }}>
                {item.estoqueMinimo}
              </div>
              <div style={{ textAlign: "right", color: "var(--color-text)" }}>
                {item.unidadesVendidas}
                <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                  {item.giroDiario.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}/dia
                </div>
              </div>
              <div style={{ textAlign: "right", fontWeight: 700, color: "var(--color-primary-dark)" }}>
                {item.sugestaoCompra}
              </div>
              <div style={{ textAlign: "right", color: "var(--color-text)" }}>
                {real(item.valorEstimadoPrecoVenda)}
                <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                  {real(item.precoUnitario)} un.
                </div>
              </div>
            </div>
          );
        })}
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
