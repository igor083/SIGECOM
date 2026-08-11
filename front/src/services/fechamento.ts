// D-5: esse serviço fala com a API de fechamento; o hook consome daqui.
import api from "./api";

export interface Fechamento {
  id: number | null;
  dataFechamento: string; // yyyy-MM-dd
  totalVendas: number;
  totalReceitas: number;
  totalDespesas: number;
  // resultado financeiro do dia (receitas - despesas). Nao e dinheiro na gaveta.
  saldoCalculado: number;
  // SCRUM-161: fundo de troco e o que se espera contar na gaveta.
  // null em fechamento gravado antes deste campo existir.
  fundoTroco: number | null;
  saldoEsperado: number | null;
  valorFisicoInformado: number | null;
  fechadoEm: string | null;
  responsavel: string | null;
}

// Preview automatico do dia
export async function obterPreviewFechamento(): Promise<Fechamento> {
  const response = await api.get<Fechamento>("/fechamentos/hoje");
  return response.data;
}

// Confirma o fechamento do dia com o valor contado e o fundo de troco informado
export async function confirmarFechamento(
  valorFisicoInformado: number,
  fundoTroco: number,
): Promise<Fechamento> {
  const response = await api.post<Fechamento>("/fechamentos", { valorFisicoInformado, fundoTroco });
  return response.data;
}