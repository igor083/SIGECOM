// =============================================================
// services/categoriasFinanceiras.ts — CRUD de categorias financeiras
// =============================================================
// Consome /categorias-financeiras. Leitura é liberada a qualquer
// usuário autenticado; escrita exige ADMIN (checado no back-end).
// =============================================================

import api from "./api";
import type { TipoLancamento } from "./lancamentos";

export type { TipoLancamento };

export interface CategoriaFinanceira {
  id: number;
  nome: string;
  tipo: TipoLancamento;
  /** Categoria de sistema: o back-end rejeita edição e remoção. */
  protegida: boolean;
}

export async function listarCategoriasFinanceiras(
  tipo?: TipoLancamento
): Promise<CategoriaFinanceira[]> {
  const response = await api.get<CategoriaFinanceira[]>("/categorias-financeiras", {
    params: tipo ? { tipo } : undefined,
  });
  return response.data;
}

export async function criarCategoriaFinanceira(
  nome: string,
  tipo: TipoLancamento
): Promise<CategoriaFinanceira> {
  const response = await api.post<CategoriaFinanceira>("/categorias-financeiras", { nome, tipo });
  return response.data;
}

/**
 * Edita a categoria. O tipo é opcional: omitido, mantém o atual — e o
 * back-end rejeita a troca de tipo se já houver lançamentos vinculados.
 */
export async function editarCategoriaFinanceira(
  id: number,
  nome: string,
  tipo?: TipoLancamento
): Promise<CategoriaFinanceira> {
  const response = await api.put<CategoriaFinanceira>(`/categorias-financeiras/${id}`, {
    nome,
    tipo,
  });
  return response.data;
}

export async function removerCategoriaFinanceira(id: number): Promise<void> {
  await api.delete(`/categorias-financeiras/${id}`);
}
