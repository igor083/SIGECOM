// =============================================================
// lib/moeda.ts — Campos em R$ no padrão brasileiro
// =============================================================
// O input type="number" só aceita ponto como separador decimal e
// descarta "12,50" (o valor chega vazio ao React). Os campos em R$
// passam a ser texto com esta máscara: vírgula decimal, até 2 casas.
// O back continua recebendo number (paraNumero em lib/validacao).
// =============================================================

/**
 * Máscara de digitação: mantém dígitos e uma vírgula, com até 2 casas.
 * Ponto digitado (teclado numérico) vira vírgula; se o texto colado já
 * tem vírgula, os pontos são separador de milhar e saem ("1.234,56").
 */
export function mascararMoeda(texto: string): string {
  const normalizado = texto.includes(",") ? texto.replace(/\./g, "") : texto.replace(/\./g, ",");
  const [inteiro, ...resto] = normalizado.replace(/[^\d,]/g, "").split(",");
  if (resto.length === 0) return inteiro;
  return `${inteiro},${resto.join("").slice(0, 2)}`;
}

/** Número vindo do sistema (ex.: preço sugerido) no formato do campo: "12,50". */
export function numeroParaMoeda(valor: number): string {
  return valor.toFixed(2).replace(".", ",");
}
