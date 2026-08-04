"use client";

import type { Saldo } from "@/services/lancamentos";
import type { PeriodoSaldo } from "@/hooks/useSaldo";

interface PainelSaldoProps {
  saldo: Saldo | null;
  periodo: PeriodoSaldo;
  loading: boolean;
  erro: string | null;
  onPeriodoChange?: (p: PeriodoSaldo) => void;
}

function real(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const PERIODOS: [PeriodoSaldo, string][] = [
  ["dia", "Hoje"],
  ["semana", "Semana"],
  ["mes", "Mês"],
];

export default function PainelSaldo({
  saldo,
  periodo,
  loading,
  erro,
  onPeriodoChange,
}: PainelSaldoProps) {
  const negativo = (saldo?.saldo ?? 0) < 0;

  return (
    <div style={{
      background: "var(--color-bg-card)",
      border: "1px solid var(--color-border)",
      borderRadius: "10px",
      padding: "20px 24px",
      marginBottom: "16px",
      boxShadow: "var(--shadow-sm)",
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "16px",
      }}>
        <h2 style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-text)", margin: 0 }}>
          Saldo operacional
        </h2>

        {onPeriodoChange && (
          <div style={{ display: "flex", gap: "4px" }}>
            {PERIODOS.map(([valor, rotulo]) => (
              <button
                key={valor}
                onClick={() => onPeriodoChange(valor)}
                style={{
                  height: "30px", padding: "0 12px", fontSize: "13px",
                  border: "1px solid var(--color-border)", borderRadius: "6px",
                  background: periodo === valor ? "var(--color-primary)" : "var(--color-bg)",
                  color: periodo === valor ? "#fff" : "var(--color-text-secondary)",
                  cursor: "pointer", fontFamily: "inherit",
                  fontWeight: periodo === valor ? 600 : 400,
                }}
              >
                {rotulo}
              </button>
            ))}
          </div>
        )}
      </div>

      {erro && (
        <p style={{ color: "var(--color-error)", fontSize: "14px", margin: 0 }}>{erro}</p>
      )}

      {!erro && loading && (
        <p style={{ color: "var(--color-text-muted)", fontSize: "14px", margin: 0 }}>Carregando...</p>
      )}

      {!erro && !loading && saldo && (
        <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
          <div>
            <span style={{ display: "block", fontSize: "12px", color: "var(--color-text-muted)", marginBottom: "4px" }}>
              Receitas
            </span>
            <strong style={{ fontSize: "18px", color: "var(--color-success)" }}>
              {real(saldo.totalReceitas)}
            </strong>
          </div>

          <div>
            <span style={{ display: "block", fontSize: "12px", color: "var(--color-text-muted)", marginBottom: "4px" }}>
              Despesas
            </span>
            <strong style={{ fontSize: "18px", color: "var(--color-error)" }}>
              {real(saldo.totalDespesas)}
            </strong>
          </div>

          <div style={{
            paddingLeft: "32px",
            borderLeft: "1px solid var(--color-border)",
            background: negativo ? "color-mix(in srgb, var(--color-error) 8%, transparent)" : "transparent",
            borderRadius: negativo ? "8px" : 0,
            padding: negativo ? "8px 16px 8px 32px" : "0 0 0 32px",
          }}>
            <span style={{ display: "block", fontSize: "12px", color: "var(--color-text-muted)", marginBottom: "4px" }}>
              Saldo {negativo && <span style={{ color: "var(--color-error)", fontWeight: 600 }}>· no vermelho</span>}
            </span>
            <strong style={{
              fontSize: "22px",
              color: negativo ? "var(--color-error)" : "var(--color-text)",
            }}>
              {real(saldo.saldo)}
            </strong>
          </div>
        </div>
      )}
    </div>
  );
}
