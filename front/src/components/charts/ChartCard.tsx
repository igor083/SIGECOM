"use client";

import type { CSSProperties, ReactNode } from "react";

interface ChartCardProps {
  titulo: string;
  vazio?: boolean;
  mensagemVazio?: string;
  acao?: ReactNode;
  children: ReactNode;
}

export default function ChartCard({
  titulo,
  vazio = false,
  mensagemVazio = "Sem dados no período.",
  acao,
  children,
}: ChartCardProps) {
  return (
    <section style={CARTAO}>
      <div style={CABECALHO}>
        <h3 style={TITULO}>{titulo}</h3>
        {acao}
      </div>
      {vazio ? <p style={VAZIO}>{mensagemVazio}</p> : children}
    </section>
  );
}

const CARTAO: CSSProperties = {
  background: "var(--color-bg-card)",
  border: "1px solid var(--color-border)",
  borderRadius: 10,
  padding: "20px 24px",
  boxShadow: "var(--shadow-sm)",
};

const CABECALHO: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "baseline",
  gap: 8,
  marginBottom: 16,
};

const TITULO: CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  color: "var(--color-text)",
  margin: 0,
};

const VAZIO: CSSProperties = {
  fontSize: 13,
  color: "var(--color-text-muted)",
  margin: 0,
};
