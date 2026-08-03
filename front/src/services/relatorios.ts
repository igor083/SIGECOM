// =============================================================
// services/relatorios.ts — Relatórios gerenciais (SIGECOM)
// =============================================================
// Espelha o RelatorioController:
//   GET /relatorios/vendas → resumo consolidado (admin-only, D-2)
// Nenhum componente chama a API direto — tudo passa por aqui (D-5).
// =============================================================

import api from "./api";

// ── Tipos ────────────────────────────────────────────────────

/** Presets aceitos pelo backend (relativos a hoje). */
export type PeriodoRelatorio = "DIA" | "SEMANA" | "MES";

/** Formas de pagamento suportadas (espelha o enum TipoPagamento do backend). */
export type TipoPagamento = "DINHEIRO" | "PIX" | "DEBITO" | "CREDITO";

/** Ponto da série diária de vendas (gráfico de barras). */
export interface VendaDiaria {
  data: string;   // yyyy-MM-dd
  total: number;
  quantidade: number;
}

/** Fatia da distribuição por forma de pagamento (gráfico de rosca). */
export interface VendaPorFormaPagamento {
  tipoPagamento: TipoPagamento;
  total: number;
  quantidade: number;
}

/** Resumo consolidado devolvido por GET /relatorios/vendas. */
export interface RelatorioVendas {
  totalVendas: number;
  quantidadeTransacoes: number;
  ticketMedio: number;
  dataInicio: string; // yyyy-MM-dd (período efetivo considerado)
  dataFim: string;    // yyyy-MM-dd
  funcionarioId: number | null;
  /** Série diária, só com dias que tiveram vendas, em ordem cronológica. */
  vendasPorDia: VendaDiaria[];
  /** Distribuição por forma de pagamento, do maior total para o menor. */
  vendasPorFormaPagamento: VendaPorFormaPagamento[];
}

/**
 * Parâmetros do relatório. Use `periodo` (preset) OU o par
 * `dataInicio`/`dataFim` (personalizado) — o backend dá prioridade
 * ao intervalo personalizado quando as duas datas vêm juntas.
 */
export interface RelatorioVendasParams {
  periodo?: PeriodoRelatorio;
  dataInicio?: string; // yyyy-MM-dd
  dataFim?: string;    // yyyy-MM-dd
  funcionarioId?: number;
}

// ── Métodos ──────────────────────────────────────────────────

/**
 * Busca o resumo de vendas do período (total, quantidade de
 * transações e ticket médio). Requer perfil ADMIN — o token é
 * anexado pelo interceptor de api.ts. (D-2)
 */
export async function obterRelatorioVendas(
  params: RelatorioVendasParams
): Promise<RelatorioVendas> {
  const response = await api.get<RelatorioVendas>("/relatorios/vendas", { params });
  return response.data;
}
