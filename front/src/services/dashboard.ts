import api from "./api";

const IS_MOCK = process.env.NEXT_PUBLIC_MOCK_API === "true";

export interface MetaVendaDiariaResponse {
  metaDia: number;
  realizadoHoje: number;
  percentual: number;
  noBazul: boolean;
}

export async function getMetaVendaDiaria(): Promise<MetaVendaDiariaResponse> {
  if (IS_MOCK) {
    await new Promise((r) => setTimeout(r, 500));
    const realizado = 640;
    const meta = 1000;
    return {
      metaDia: meta,
      realizadoHoje: realizado,
      percentual: (realizado / meta) * 100,
      noBazul: realizado >= meta,
    };
  }
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
  if (IS_MOCK) {
    await new Promise((r) => setTimeout(r, 600));
    return {
      totalVendas: 12450,
      quantidadeTransacoes: 87,
      ticketMedio: 143.1,
      itensEmAlerta: 5,
      totalReceitas: 15000,
      totalDespesas: 8200,
      saldoFinanceiro: 6800,
      dataInicio: "2026-08-04",
      dataFim: "2026-08-10",
      vendasPorDia: [
        { data: "2026-08-04", total: 1800, quantidade: 12 },
        { data: "2026-08-05", total: 2200, quantidade: 15 },
        { data: "2026-08-06", total: 1500, quantidade: 10 },
        { data: "2026-08-07", total: 2600, quantidade: 18 },
        { data: "2026-08-08", total: 2900, quantidade: 20 },
        { data: "2026-08-09", total: 1450, quantidade: 12 },
      ],
      vendasPorFormaPagamento: [
        { tipo: "PIX", total: 5600, quantidade: 39 },
        { tipo: "CREDITO", total: 3700, quantidade: 26 },
        { tipo: "DINHEIRO", total: 1900, quantidade: 13 },
        { tipo: "DEBITO", total: 1250, quantidade: 9 },
      ],
      topProdutos: [
        { produtoId: 1, nome: "Ração Premium 15kg", categoria: "Alimentação", unidades: 42, receita: 4200 },
        { produtoId: 2, nome: "Filtro UV 30W", categoria: "Equipamentos", unidades: 31, receita: 3100 },
        { produtoId: 3, nome: "Substrato Amazônia", categoria: "Decoração", unidades: 28, receita: 1400 },
        { produtoId: 4, nome: "Termômetro Digital", categoria: "Equipamentos", unidades: 24, receita: 720 },
        { produtoId: 5, nome: "Anti-cloro 500ml", categoria: "Tratamento", unidades: 19, receita: 570 },
      ],
    };
  }
  const res = await api.get<DashboardDesempenhoResponse>("/dashboard/desempenho", {
    params: { periodo },
  });
  return res.data;
}
