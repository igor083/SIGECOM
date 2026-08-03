"use client";

// Cards de KPI do relatório de vendas. Componente apresentacional puro:
// recebe tudo por prop (dados/loading/erro), sem chamar API — igual ao PainelSaldo.

import type { RelatorioVendas } from "@/services/relatorios";

interface ResumoVendasProps {
  relatorio: RelatorioVendas | null;
  loading: boolean;
  erro: string | null;
}

function real(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function dataBr(iso: string): string {
  // iso vem como "yyyy-MM-dd"; monta em horário local para não cair no dia anterior.
  const [ano, mes, dia] = iso.split("-").map(Number);
  return new Date(ano, mes - 1, dia).toLocaleDateString("pt-BR");
}

interface Card {
  rotulo: string;
  valor: string;
  destaque?: boolean;
}

export default function ResumoVendas({ relatorio, loading, erro }: ResumoVendasProps) {
  if (erro) {
    return (
      <div style={caixa}>
        <p style={{ color: "#dc2626", fontSize: 14, margin: 0 }}>{erro}</p>
      </div>
    );
  }

  if (loading || !relatorio) {
    return (
      <div style={caixa}>
        <p style={{ color: "#94a3b8", fontSize: 14, margin: 0 }}>Carregando relatório...</p>
      </div>
    );
  }

  const cards: Card[] = [
    { rotulo: "Total de vendas", valor: real(relatorio.totalVendas), destaque: true },
    { rotulo: "Transações", valor: String(relatorio.quantidadeTransacoes) },
    { rotulo: "Ticket médio", valor: real(relatorio.ticketMedio) },
  ];

  return (
    <div style={caixa}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: "#0f172a", margin: 0 }}>
          Desempenho de vendas
        </h2>
        <span style={{ fontSize: 13, color: "#64748b" }}>
          {dataBr(relatorio.dataInicio)} — {dataBr(relatorio.dataFim)}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
        {cards.map((c) => (
          <div
            key={c.rotulo}
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: 10,
              padding: "16px 18px",
              background: c.destaque ? "#eff6ff" : "#f8fafc",
            }}
          >
            <span style={{ display: "block", fontSize: 12, color: "#64748b", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.03em", fontWeight: 600 }}>
              {c.rotulo}
            </span>
            <strong style={{ fontSize: 24, color: c.destaque ? "#1d4ed8" : "#0f172a" }}>
              {c.valor}
            </strong>
          </div>
        ))}
      </div>

      {relatorio.quantidadeTransacoes === 0 && (
        <p style={{ marginTop: 14, marginBottom: 0, fontSize: 13, color: "#94a3b8" }}>
          Nenhuma venda no período selecionado.
        </p>
      )}
    </div>
  );
}

const caixa: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 10,
  padding: "20px 24px",
  boxShadow: "0 1px 4px rgba(0,0,0,.06)",
};
