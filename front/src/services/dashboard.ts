import api from "./api";

export interface MetaVendaDiariaResponse {
  metaDia: number;
  realizadoHoje: number;
  percentual: number;
  noBazul: boolean;
}

export async function getMetaVendaDiaria(): Promise<MetaVendaDiariaResponse> {
  const res = await api.get<MetaVendaDiariaResponse>("/dashboard/meta-diaria");
  return res.data;
}

export type PeriodoRelatorio = "DIA" | "SEMANA" | "MES";
export type TipoPagamento = "DINHEIRO" | "PIX" | "DEBITO" | "CREDITO";

export interface VendaDiaria {
  data: string;
  total: number;
  quantidade: number;
}

export interface FormaPagamento {
  tipo: TipoPagamento;
  total: number;
  quantidade: number;
}

export interface TopProduto {
  produtoId: number;
  nome: string;
  categoria: string;
  unidades: number;
  receita: number;
}

export interface DashboardDesempenhoResponse {
  totalVendas: number;
  quantidadeTransacoes: number;
  ticketMedio: number;
  itensEmAlerta: number;
  totalReceitas: number;
  totalDespesas: number;
  saldoFinanceiro: number;
  dataInicio: string;
  dataFim: string;
  vendasPorDia: VendaDiaria[];
  vendasPorFormaPagamento: FormaPagamento[];
  topProdutos: TopProduto[];
}

export async function getDashboardDesempenho(
  periodo: PeriodoRelatorio = "SEMANA"
): Promise<DashboardDesempenhoResponse> {
  const res = await api.get<DashboardDesempenhoResponse>("/dashboard/desempenho", {
    params: { periodo },
  });
  return res.data;
}
