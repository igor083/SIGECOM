"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import type { ItemEstoque, RelatorioEstoque } from "@/services/relatoriosEstoque";
import { STATUS_META } from "@/lib/statusEstoque";

interface TabelaEstoqueProps {
  relatorio: RelatorioEstoque | null;
  loading: boolean;
  erro: string | null;
}

const COLUNAS = "1fr 110px 110px 150px 120px";

function real(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function Badge({ item }: { item: ItemEstoque }) {
  const meta = STATUS_META[item.status];
  return (
    <span
      style={{
        fontSize: 12,
        fontWeight: 600,
        color: meta.cor,
        background: meta.fundo,
        borderRadius: 999,
        padding: "3px 10px",
      }}
    >
      {meta.rotulo}
    </span>
  );
}

export default function TabelaEstoque({ relatorio, loading, erro }: TabelaEstoqueProps) {
  const itens = relatorio?.itens ?? [];

  return (
    <div style={caixa}>
      <div style={cabecalho}>
        <span>Produto / Categoria</span>
        <span style={{ textAlign: "right" }}>Qtd. atual</span>
        <span style={{ textAlign: "right" }}>Mínimo</span>
        <span style={{ textAlign: "right" }}>Valor em estoque</span>
        <span style={{ textAlign: "center" }}>Status</span>
      </div>

      {erro && <div style={mensagem("var(--color-error)")}>{erro}</div>}

      {!erro && loading && <div style={mensagem()}>Carregando...</div>}

      {!erro && !loading && itens.length === 0 && (
        <div style={mensagem()}>Nenhum produto encontrado para os filtros selecionados.</div>
      )}

      {!erro && !loading &&
        itens.map((item, idx) => {
          const meta = STATUS_META[item.status];
          const destacado = item.status !== "NORMAL";
          return (
            <div
              key={item.id}
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
                  href={`/relatorios/estoque/movimentacoes?produtoId=${item.id}`}
                  style={{ fontWeight: 500, color: "var(--color-primary)", textDecoration: "none" }}
                  title="Ver movimentações deste produto"
                >
                  {item.nome}
                </Link>
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
                {real(item.valorEmEstoque)}
              </div>
              <div style={{ textAlign: "center" }}>
                <Badge item={item} />
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
