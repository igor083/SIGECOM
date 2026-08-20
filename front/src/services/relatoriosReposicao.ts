import api from "./api";
import type { StatusEstoque } from "./relatoriosEstoque";

export interface ItemReposicao {
  produtoId: number;
  nome: string;
  categoriaId: number;
  categoriaNome: string;
  qtdEstoque: number;
  estoqueMinimo: number;
  unidadesVendidas: number;
  giroDiario: number;
  sugestaoCompra: number;
  precoUnitario: number;
  valorEstimadoPrecoVenda: number;
  status: StatusEstoque;
}

export interface ResumoReposicao {
  produtosParaRepor: number;
  unidadesSugeridas: number;
  // o back manda o valor calculado pelo preco de venda, porque Produto nao tem custo
  valorEstimadoPrecoVenda: number;
  janelaDias: number;
  coberturaDias: number;
  dataInicio: string;
  dataFim: string;
}

export interface RelatorioReposicao {
  resumo: ResumoReposicao;
  itens: ItemReposicao[];
}

export interface RelatorioReposicaoParams {
  categoriaId?: number;
  janelaDias?: number;
  coberturaDias?: number;
}

// D-5: a chamada HTTP mora aqui; pagina e componente nunca falam com a API direto
export async function obterRelatorioReposicao(
  params: RelatorioReposicaoParams,
  signal?: AbortSignal
): Promise<RelatorioReposicao> {
  const response = await api.get<RelatorioReposicao>("/relatorios/estoque/reposicao", { params, signal });
  return response.data;
}
