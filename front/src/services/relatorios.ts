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
