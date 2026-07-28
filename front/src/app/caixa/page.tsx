"use client";

// Qualquer usuario autenticado pode fechar

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useFechamento } from "@/hooks/useFechamento";
import AppShell from "@/components/AppShell";

function formatarReal(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarDataHora(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function CaixaPage() {
  const router = useRouter();
  const { loading: authLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace("/login");
  }, [authLoading, isAuthenticated, router]);

  const { preview, loading, erro, confirmando, erroConfirmar, fechamentoConfirmado, confirmar } =
    useFechamento();

  const [valorFisico, setValorFisico] = useState("");

  if (authLoading || !isAuthenticated) return null;

  async function handleConfirmar() {
    const valor = Number(valorFisico);
    if (!valorFisico || isNaN(valor) || valor < 0) return;
    try {
      await confirmar(valor);
    } catch {
    }
  }

  // depois de confirmado mostra o comprovante 
  if (fechamentoConfirmado) {
    return (
      <AppShell title="Fechamento de Caixa">
        <div style={{
          maxWidth: "480px", background: "#fff", border: "1px solid #e2e8f0",
          borderRadius: "10px", padding: "32px", boxShadow: "0 1px 4px rgba(0,0,0,.06)",
        }}>
          <h2 style={{ margin: "0 0 4px", fontSize: "18px", color: "#0f172a" }}>
            Caixa fechado
          </h2>
          <p style={{ margin: "0 0 24px", fontSize: "13px", color: "#94a3b8" }}>
            {formatarDataHora(fechamentoConfirmado.fechadoEm!)}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748b" }}>Total de vendas</span>
              <span>{formatarReal(fechamentoConfirmado.totalVendas)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748b" }}>Total de receitas</span>
              <span>{formatarReal(fechamentoConfirmado.totalReceitas)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748b" }}>Total de despesas</span>
              <span style={{ color: "#dc2626" }}>{formatarReal(fechamentoConfirmado.totalDespesas)}</span>
            </div>
            <div style={{
              display: "flex", justifyContent: "space-between", paddingTop: "10px",
              borderTop: "1px solid #f1f5f9", fontWeight: 600,
            }}>
              <span>Saldo calculado</span>
              <span>{formatarReal(fechamentoConfirmado.saldoCalculado)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748b" }}>Valor físico conferido</span>
              <span>{formatarReal(fechamentoConfirmado.valorFisicoInformado!)}</span>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Fechamento de Caixa">
      <div style={{
        maxWidth: "480px", background: "#fff", border: "1px solid #e2e8f0",
        borderRadius: "10px", padding: "32px", boxShadow: "0 1px 4px rgba(0,0,0,.06)",
      }}>
        {loading && (
          <p style={{ color: "#94a3b8", fontSize: "14px" }}>Calculando o fechamento do dia...</p>
        )}

        {erro && (
          <p style={{ color: "#dc2626", fontSize: "14px" }}>{erro}</p>
        )}

        {!loading && !erro && preview && (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "14px", marginBottom: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Total de vendas</span>
                <span>{formatarReal(preview.totalVendas)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Total de receitas</span>
                <span>{formatarReal(preview.totalReceitas)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Total de despesas</span>
                <span style={{ color: "#dc2626" }}>{formatarReal(preview.totalDespesas)}</span>
              </div>
              <div style={{
                display: "flex", justifyContent: "space-between", paddingTop: "10px",
                borderTop: "1px solid #f1f5f9", fontWeight: 600,
              }}>
                <span>Saldo calculado</span>
                <span>{formatarReal(preview.saldoCalculado)}</span>
              </div>
            </div>

            <label style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }} htmlFor="valor-fisico">
              Valor físico contado em caixa
            </label>
            <input
              id="valor-fisico"
              type="number"
              min="0"
              step="0.01"
              value={valorFisico}
              onChange={(e) => setValorFisico(e.target.value)}
              disabled={confirmando}
              style={{
                width: "100%", height: "40px", padding: "0 12px", marginTop: "4px", marginBottom: "16px",
                fontSize: "14px", border: "1px solid #e2e8f0", borderRadius: "6px",
              }}
            />

            {erroConfirmar && (
              <p style={{ color: "#dc2626", fontSize: "13px", marginBottom: "12px" }}>{erroConfirmar}</p>
            )}

            <button
              onClick={handleConfirmar}
              disabled={confirmando || !valorFisico}
              style={{
                width: "100%", height: "42px", fontSize: "14px", fontWeight: 600,
                border: "none", borderRadius: "6px", cursor: confirmando ? "not-allowed" : "pointer",
                background: confirmando ? "#93c5fd" : "#2563eb", color: "#fff",
              }}
            >
              {confirmando ? "Confirmando..." : "Confirmar fechamento"}
            </button>
          </>
        )}
      </div>
    </AppShell>
  );
}

