// =============================================================
// lib/descricoesLancamento.ts — Rótulos do enum DescricaoLancamento
// =============================================================
// Mapa escrito à mão para garantir acentuação e preposições
// corretas ("Conta de luz", "Manutenção", "Salário").
//
// Reutilizado por:
//   - components/FormLancamento.tsx  (select de descrição)
//   - app/financeiro/page.tsx        (coluna da tabela)
//   - app/receita/page.tsx           (SCRUM-21, Igor)
//
// NÃO use derivação automática (replace(/_/g, " ") etc.) —
// ela perde acentos e preposições. Este arquivo é a única fonte
// de verdade para os rótulos em português.
// =============================================================

import type { DescricaoLancamento, TipoLancamento } from "@/services/lancamentos";

// Cada entrada: [valor do enum Java, rótulo em português]
export const DESCRICOES_DESPESA: [DescricaoLancamento, string][] = [
  ["COMPRA_MERCADORIA",  "Compra de mercadoria"],
  ["SALARIO",           "Salário"],
  ["ALUGUEL",           "Aluguel"],
  ["CONTA_LUZ",         "Conta de luz"],
  ["CONTA_AGUA",        "Conta de água"],
  ["INTERNET_TELEFONE", "Internet / Telefone"],
  ["MANUTENCAO",        "Manutenção"],
  ["IMPOSTOS",          "Impostos"],
  ["FORNECEDORES",      "Fornecedores"],
  ["OUTRA_DESPESA",     "Outra despesa"],
];

export const DESCRICOES_RECEITA: [DescricaoLancamento, string][] = [
  ["VENDA",              "Venda"],
  ["RECEBIMENTO_DIVIDA", "Recebimento de dívida"],
  ["OUTRA_RECEITA",      "Outra receita"],
];

/** Retorna a lista de descrições para o tipo recebido. */
export function descrPorTipo(tipo: TipoLancamento): [DescricaoLancamento, string][] {
  return tipo === "DESPESA" ? DESCRICOES_DESPESA : DESCRICOES_RECEITA;
}

/**
 * Mapa completo enum → rótulo em português, para lookup O(1) na tabela.
 * Cobre DESPESA e RECEITA.
 */
export const ROTULO_DESCRICAO = new Map<DescricaoLancamento, string>([
  ...DESCRICOES_DESPESA,
  ...DESCRICOES_RECEITA,
]);

/**
 * Retorna o rótulo em português da descrição.
 * Se o valor não estiver no mapa (novo enum adicionado no backend),
 * devolve o próprio valor bruto para não quebrar a UI.
 */
export function rotuloDescricao(d: DescricaoLancamento): string {
  return ROTULO_DESCRICAO.get(d) ?? d;
}
