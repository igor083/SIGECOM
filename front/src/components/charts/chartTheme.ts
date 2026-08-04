"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

export interface ChartTokens {
  texto: string;
  eixo: string;
  grade: string;
  primaria: string;
  card: string;
}

const PADRAO: ChartTokens = {
  texto: "#475569",
  eixo: "#e2e8f0",
  grade: "#f1f5f9",
  primaria: "#2563eb",
  card: "#ffffff",
};

export const CHART_CURSOR = "rgba(37,99,235,0.08)";

export const ESTILO_TOOLTIP: CSSProperties = {
  background: "var(--color-bg-card)",
  border: "1px solid var(--color-border)",
  borderRadius: 8,
  fontSize: 13,
  color: "var(--color-text)",
  boxShadow: "var(--shadow-md)",
};

export function useChartTokens(): ChartTokens {
  const [tokens, setTokens] = useState<ChartTokens>(PADRAO);
  useEffect(() => {
    const ler = () => {
      const cs = getComputedStyle(document.documentElement);
      const v = (nome: string, fallback: string) => cs.getPropertyValue(nome).trim() || fallback;
      setTokens({
        texto: v("--color-text-secondary", PADRAO.texto),
        eixo: v("--color-border", PADRAO.eixo),
        grade: v("--color-border", PADRAO.grade),
        primaria: v("--color-primary", PADRAO.primaria),
        card: v("--color-bg-card", PADRAO.card),
      });
    };
    ler();
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", ler);
    return () => mq.removeEventListener("change", ler);
  }, []);
  return tokens;
}
