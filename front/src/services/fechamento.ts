// D-5: esse serviço fala com a API de fechamento; o hook consome daqui.
import api from "./api";

export interface Fechamento {
  id: number | null;
  dataFechamento: string; // yyyy-MM-dd
  totalVendas: number;
  totalReceitas: number;
  totalDespesas: number;
  saldoCalculado: number;
  valorFisicoInformado: number | null;
  fechadoEm: string | null;
  responsavel: string | null;
}

// Preview automatico do dia
export async function obterPreviewFechamento(): Promise<Fechamento> {
  const response = await api.get<Fechamento>("/fechamentos/hoje");
  return response.data;
}

// Confirma o fechamento do dia com o valor contado
export async function confirmarFechamento(valorFisicoInformado: number): Promise<Fechamento> {
  const response = await api.post<Fechamento>("/fechamentos", { valorFisicoInformado });
  return response.data;
}