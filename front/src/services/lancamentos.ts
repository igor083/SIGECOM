// =============================================================
// services/lancamentos.ts — Serviço do módulo Financeiro (SIGECOM)
// =============================================================
// Encapsula todas as chamadas HTTP de lançamentos financeiros e
// categorias financeiras.  Nenhum componente chama a API direto —
// tudo passa por aqui. (driver D-5 — Manutenibilidade)
// =============================================================

import api from "./api"; // D-5: instância centralizada com interceptor de auth

// ── Tipos de Dados ────────────────────────────────────────────

export type TipoLancamento = "RECEITA" | "DESPESA";

export interface CategoriaFinanceira {
  id: number;
  nome: string;
  tipo: TipoLancamento;
}

export interface LancamentoResponse {
  id: number;
  valor: number;
  dataHora: string; // ISO-8601 string (LocalDateTime → string no JSON)
  tipo: TipoLancamento;
  descricao: string;
  categoria: CategoriaFinanceira;
}

/** Payload enviado ao POST /lancamentos */
export interface LancamentoRequest {
  valor: number;
  data: string;        // yyyy-MM-dd  (LocalDate no backend)
  categoriaId: number;
  descricao: string;
  tipo: TipoLancamento;
}

/** Estrutura de paginação compatível com Page<T> do Spring Boot */
export interface PageLancamento {
  content: LancamentoResponse[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

// ── Métodos de Serviço ────────────────────────────────────────

/**
 * Registra um novo lançamento financeiro (DESPESA ou RECEITA).
 * Requer autenticação — token anexado pelo interceptor de api.ts. (D-2)
 */
export async function registrarLancamento(
  req: LancamentoRequest
): Promise<LancamentoResponse> {
  const response = await api.post<LancamentoResponse>("/lancamentos", req);
  return response.data;
}

/**
 * Lista lançamentos com filtros opcionais e paginação.
 * Requer autenticação. (D-2)
 */
export async function listarLancamentos(params: {
  tipo?: TipoLancamento;
  categoriaId?: number;
  dataInicio?: string; // yyyy-MM-dd
  dataFim?: string;    // yyyy-MM-dd
  page?: number;
  size?: number;
}): Promise<PageLancamento> {
  const response = await api.get<PageLancamento>("/lancamentos", { params });
  return response.data;
}

/**
 * Lista as categorias financeiras, com filtro opcional por tipo.
 * Usada para popular o select do formulário de lançamento.
 */
export async function listarCategoriasFinanceiras(
  tipo?: TipoLancamento
): Promise<CategoriaFinanceira[]> {
  const response = await api.get<CategoriaFinanceira[]>(
    "/categorias-financeiras",
    { params: tipo ? { tipo } : {} }
  );
  return response.data;
}
