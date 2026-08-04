import api from "./api";
import type { PeriodoRelatorio } from "./relatorios";

export interface MovimentacaoProduto {
  produtoId: number;
  produtoNome: string;
  categoriaNome: string;
  unidades: number;
  receita: number;
  numVendas: number;
}

export interface MovimentacaoDia {
  data: string;
  unidades: number;
  receita: number;
}

export interface ResumoMovimentacao {
  totalUnidades: number;
  totalReceita: number;
  produtosDistintos: number;
}

export interface RelatorioMovimentacao {
  dataInicio: string;
  dataFim: string;
  produtoId: number | null;
  categoriaId: number | null;
  resumo: ResumoMovimentacao;
  porProduto: MovimentacaoProduto[];
  porDia: MovimentacaoDia[];
}

export interface RelatorioMovimentacaoParams {
  produtoId?: number;
  categoriaId?: number;
  periodo?: PeriodoRelatorio;
  dataInicio?: string;
  dataFim?: string;
}

export async function obterRelatorioMovimentacao(
  params: RelatorioMovimentacaoParams
): Promise<RelatorioMovimentacao> {
  const response = await api.get<RelatorioMovimentacao>("/relatorios/estoque/movimentacoes", {
    params,
  });
  return response.data;
}
