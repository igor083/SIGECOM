import api from "./api";

export type PeriodoRelatorio = "DIA" | "SEMANA" | "MES";

export type TipoPagamento = "DINHEIRO" | "PIX" | "DEBITO" | "CREDITO";

export interface VendaDiaria {
  data: string;
  total: number;
  quantidade: number;
}

export interface VendaPorFormaPagamento {
  tipoPagamento: TipoPagamento;
  total: number;
  quantidade: number;
}

export interface RelatorioVendas {
  totalVendas: number;
  quantidadeTransacoes: number;
  ticketMedio: number;
  dataInicio: string;
  dataFim: string;
  funcionarioId: number | null;
  vendasPorDia: VendaDiaria[];
  vendasPorFormaPagamento: VendaPorFormaPagamento[];
}

export interface RelatorioVendasParams {
  periodo?: PeriodoRelatorio;
  dataInicio?: string;
  dataFim?: string;
  funcionarioId?: number;
}

export async function obterRelatorioVendas(
  params: RelatorioVendasParams
): Promise<RelatorioVendas> {
  const response = await api.get<RelatorioVendas>("/relatorios/vendas", { params });
  return response.data;
}

export type TipoLancamento = "RECEITA" | "DESPESA";

export interface CategoriaFinanceiraTotal {
  categoriaId: number;
  categoriaNome: string;
  tipo: TipoLancamento;
  total: number;
}

export interface RelatorioFinanceiro {
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
  dataInicio: string;
  dataFim: string;
  porCategoria: CategoriaFinanceiraTotal[];
}

export interface RelatorioFinanceiroParams {
  periodo?: PeriodoRelatorio;
  dataInicio?: string;
  dataFim?: string;
  categoriaId?: number;
}

export async function obterRelatorioFinanceiro(
  params: RelatorioFinanceiroParams
): Promise<RelatorioFinanceiro> {
  const response = await api.get<RelatorioFinanceiro>("/relatorios/financeiro", { params });
  return response.data;
}
