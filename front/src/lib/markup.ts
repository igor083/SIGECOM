// =============================================================
// lib/markup.ts — Utilitário de Markup e Sugestão de Preços
// =============================================================

export interface ParametrosFinanceiros {
  custosFixosPercent: number;
  impostosPercent: number;
  taxaMaquininhaPercent: number;
  comissaoPercent: number;
  lucroDesejadoPercent: number;
  diasUteis: number;
}

/**
 * Calcula o markup com base nos parâmetros financeiros da loja.
 * Fórmula: markup = 1 / (1 - somaPercentuais)
 */
export function calcularMarkup(params: ParametrosFinanceiros): number {
  const totalPercentuais =
    (params.custosFixosPercent || 0) +
    (params.impostosPercent || 0) +
    (params.taxaMaquininhaPercent || 0) +
    (params.comissaoPercent || 0) +
    (params.lucroDesejadoPercent || 0);

  const percentualDecimal = totalPercentuais / 100;

  // Evita divisão por zero ou markup negativo se a soma for 100% ou mais
  if (percentualDecimal >= 1) {
    return 0;
  }

  return 1 / (1 - percentualDecimal);
}

/**
 * Sugere o preço de venda com base no custo (CMV) e parâmetros da loja.
 * Fórmula: precoSugerido = CMV * markup
 */
export function precoSugerido(cmv: number, params: ParametrosFinanceiros): number {
  if (cmv < 0) return 0;
  const markup = calcularMarkup(params);
  return cmv * markup;
}
