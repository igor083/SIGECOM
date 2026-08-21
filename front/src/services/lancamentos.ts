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

// SCRUM-162: forma de pagamento afeta o fechamento de caixa (so DINHEIRO conta na gaveta)
export type FormaPagamentoLancamento =
  | "DINHEIRO"
  | "PIX"
  | "DEBITO"
  | "CREDITO"
  | "TRANSFERENCIA"
  | "BOLETO"
  | "OUTRO";

// Categoria financeira tem uma definição só, em categoriasFinanceiras.ts.
// Havia uma cópia aqui, e ela estava incompleta: faltava `protegida`, que a API
// devolve tanto no GET /categorias-financeiras quanto aninhada no lançamento.
// Quem lia a categoria por este módulo não enxergava o campo e não tinha como
// saber que aquela categoria é de sistema.
//
// Importado para uso local (LancamentoResponse.categoria) e reexportado para os
// imports existentes continuarem valendo. `import type` some na compilação,
// então não cria ciclo em runtime com categoriasFinanceiras.ts.
import type { CategoriaFinanceira } from "./categoriasFinanceiras";
export type { CategoriaFinanceira };

export interface LancamentoResponse {
  id: number;
  valor: number;
  dataHora: string; // ISO-8601 string (LocalDateTime → string no JSON)
  tipo: TipoLancamento;
  descricao: string;
  categoria: CategoriaFinanceira;
  formaPagamento: FormaPagamentoLancamento;
}

/** Payload enviado ao POST /lancamentos */
export interface LancamentoRequest {
  valor: number;
  data: string;        // yyyy-MM-dd  (LocalDate no backend)
  categoriaId: number;
  descricao: string;
  tipo: TipoLancamento;
  formaPagamento: FormaPagamentoLancamento; // obrigatorio (SCRUM-162)
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
 *
 * Implementação em categoriasFinanceiras.ts — este módulo tinha uma segunda
 * cópia, chamando o mesmo endpoint e devolvendo um tipo sem `protegida`. Duas
 * funções com o mesmo nome para o mesmo recurso é como o campo se perdeu:
 * corrigir uma delas não corrigia a outra.
 */
export { listarCategoriasFinanceiras } from "./categoriasFinanceiras";

export interface Saldo {
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
  dataInicio: string; // yyyy-MM-dd
  dataFim: string;
}

// D-2: so ADMIN, o backend barra os outros perfis
export async function obterSaldo(
  dataInicio?: string,
  dataFim?: string
): Promise<Saldo> {
  const response = await api.get<Saldo>("/lancamentos/saldo", {
    params: { dataInicio, dataFim },
  });
  return response.data;
}
