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

export async function atualizarMetaVendaDiaria(valor: number): Promise<MetaVendaDiariaResponse> {
  if (IS_MOCK) {
    await new Promise((r) => setTimeout(r, 500));
    const realizado = 640;
    return {
      metaDia: valor,
      realizadoHoje: realizado,
      percentual: (realizado / valor) * 100,
      noBazul: realizado >= valor,
    };
  }
  const res = await api.put<MetaVendaDiariaResponse>("/dashboard/meta-diaria", { valor });
  return res.data;
}
