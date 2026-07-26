"use client";

// Cartao de saldo do periodo. Recebe tudo por prop pra funcionar em qualquer tela,
// o Henzo reaproveita na tela de gestao dele no SCRUM-26.

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
      background: "#fff",
      border: "1px solid #e2e8f0",
      borderRadius: "10px",
      padding: "20px 24px",
      marginBottom: "16px",
      boxShadow: "0 1px 4px rgba(0,0,0,.06)",
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "16px",
      }}>
        <h2 style={{ fontSize: "15px", fontWeight: 600, color: "#0f172a", margin: 0 }}>
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
                  border: "1px solid #e2e8f0", borderRadius: "6px",
                  background: periodo === valor ? "#2563eb" : "#f8fafc",
                  color: periodo === valor ? "#fff" : "#475569",
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
        <p style={{ color: "#dc2626", fontSize: "14px", margin: 0 }}>{erro}</p>
      )}

      {!erro && loading && (
        <p style={{ color: "#94a3b8", fontSize: "14px", margin: 0 }}>Carregando...</p>
      )}

      {!erro && !loading && saldo && (
        <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
          <div>
            <span style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "4px" }}>
              Receitas
            </span>
            <strong style={{ fontSize: "18px", color: "#16a34a" }}>
              {real(saldo.totalReceitas)}
            </strong>
          </div>

          <div>
            <span style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "4px" }}>
              Despesas
            </span>
            <strong style={{ fontSize: "18px", color: "#dc2626" }}>
              {real(saldo.totalDespesas)}
            </strong>
          </div>

          {/* saldo negativo ganha fundo e rotulo, nao so o sinal de menos */}
          <div style={{
            paddingLeft: "32px",
            borderLeft: "1px solid #f1f5f9",
            background: negativo ? "#fef2f2" : "transparent",
            borderRadius: negativo ? "8px" : 0,
            padding: negativo ? "8px 16px 8px 32px" : "0 0 0 32px",
          }}>
            <span style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "4px" }}>
              Saldo {negativo && <span style={{ color: "#dc2626", fontWeight: 600 }}>· no vermelho</span>}
            </span>
            <strong style={{
              fontSize: "22px",
              color: negativo ? "#dc2626" : "#0f172a",
            }}>
              {real(saldo.saldo)}
            </strong>
          </div>
        </div>
      )}
    </div>
  );
}
