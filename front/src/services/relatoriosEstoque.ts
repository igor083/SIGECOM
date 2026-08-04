import api from "./api";

export type StatusEstoque = "NORMAL" | "ALERTA" | "CRITICO";

export type OrdenacaoEstoque = "QUANTIDADE_ASC" | "QUANTIDADE_DESC";

export interface ItemEstoque {
  id: number;
  nome: string;
  categoriaId: number;
  categoriaNome: string;
  qtdEstoque: number;
  estoqueMinimo: number;
  preco: number;
  valorEmEstoque: number;
  status: StatusEstoque;
}

export interface ResumoEstoque {
  totalProdutos: number;
  emAlerta: number;
  emCritico: number;
  valorTotalEstoque: number;
}

export interface RelatorioEstoque {
  resumo: ResumoEstoque;
  itens: ItemEstoque[];
}

export interface RelatorioEstoqueParams {
  categoriaId?: number;
  busca?: string;
  ordenacao?: OrdenacaoEstoque;
}

export async function obterRelatorioEstoque(
  params: RelatorioEstoqueParams
): Promise<RelatorioEstoque> {
  const response = await api.get<RelatorioEstoque>("/relatorios/estoque", { params });
  return response.data;
}
