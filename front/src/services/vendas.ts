// =============================================================
// services/vendas.ts — Serviço de vendas do PDV (SIGECOM)
// =============================================================
// Espelha os endpoints do VendaController:
//   POST /vendas/calcular  → preview (US-026)
//   POST /vendas           → confirma + baixa estoque (US-027)
// =============================================================

import api from "./api";

// ── Tipos ────────────────────────────────────────────────────

export type TipoDesconto = "PERCENTUAL" | "VALOR_FIXO";

export interface ItemVendaRequest {
  produtoId: number;
  quantidade: number;
  tipoDesconto?: TipoDesconto | null;
  valorDesconto?: number | null;
}

export interface VendaRequest {
  itens: ItemVendaRequest[];
}

export interface ItemVendaResponse {
  produtoId: number;
  nomeProduto: string;
  quantidade: number;
  precoUnitario: number;
  tipoDesconto: TipoDesconto | null;
  valorDesconto: number;
  descontoAplicado: number;
  subtotal: number;
}

export interface CalculoVendaResponse {
  itens: ItemVendaResponse[];
  subtotal: number;
  descontoTotal: number;
  total: number;
}

export interface VendaResponse {
  id: number;
  dataHora: string;
  operador: string;
  itens: ItemVendaResponse[];
  subtotal: number;
  descontoTotal: number;
  total: number;
}

// ── Métodos ──────────────────────────────────────────────────

/**
 * Recalcula subtotal, desconto total e total final no servidor
 * a partir dos itens do carrinho. Chamado a cada mudança
 * (CA US-026 — cálculo automático).
 */
export async function calcularVenda(request: VendaRequest): Promise<CalculoVendaResponse> {
  const response = await api.post<CalculoVendaResponse>("/vendas/calcular", request);
  return response.data;
}

/**
 * Confirma a venda: persiste + baixa estoque em transação
 * atômica e devolve o comprovante simplificado (US-027).
 */
export async function confirmarVenda(request: VendaRequest): Promise<VendaResponse> {
  const response = await api.post<VendaResponse>("/vendas", request);
  return response.data;
}
