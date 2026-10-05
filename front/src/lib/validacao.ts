// =============================================================
// lib/validacao.ts — Regras de validação de campo
// =============================================================
// Usadas pelos formulários de Produto, Lançamento e Usuário com o
// hook useValidacaoFormulario. Espelham as anotações dos requests
// do back (@NotBlank, @Email, @Size, @Positive, @DecimalMin, @Min,
// @Pattern) para o erro aparecer ao sair do campo, e não só na
// resposta da API (ISO 9241-17, 6.4.2 e 7.3).
//
// Cada regra devolve a mensagem de erro ou null. Só `obrigatorio`
// reprova vazio: campo opcional é checado apenas se preenchido.
// =============================================================

export type Regra = (valor: string) => string | null;

/** Aplica as regras em ordem e devolve o primeiro erro. */
export function regras(...lista: Regra[]): Regra {
  return (valor) => {
    for (const regra of lista) {
      const erro = regra(valor);
      if (erro) return erro;
    }
    return null;
  };
}

export function obrigatorio(mensagem: string): Regra {
  return (valor) => (valor.trim() ? null : mensagem);
}

export function tamanhoMinimo(minimo: number, mensagem: string): Regra {
  return (valor) => (!valor || valor.length >= minimo ? null : mensagem);
}

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const email: Regra = (valor) =>
  !valor.trim() || RE_EMAIL.test(valor.trim())
    ? null
    : "Digite um e-mail válido, ex.: nome@empresa.com";

/** Mesmo critério do @Pattern de imagemUrl no back: http:// ou https://. */
export function urlHttp(mensagem: string): Regra {
  return (valor) => {
    const limpo = valor.trim();
    if (!limpo) return null;
    try {
      const url = new URL(limpo);
      return url.protocol === "http:" || url.protocol === "https:" ? null : mensagem;
    } catch {
      return mensagem;
    }
  };
}

/** Converte o texto do campo em número; NaN se não for numérico. */
export function paraNumero(valor: string): number {
  const limpo = valor.trim();
  return limpo ? Number(limpo) : NaN;
}

export function monetario(mensagens: { negativo: string; zero?: string }): Regra {
  return (valor) => {
    if (!valor.trim()) return null;
    const numero = paraNumero(valor);
    if (Number.isNaN(numero)) return "Digite um valor numérico, ex.: 12,50";
    if (numero < 0) return mensagens.negativo;
    if (mensagens.zero && numero === 0) return mensagens.zero;
    return null;
  };
}

export function inteiroNaoNegativo(mensagem: string): Regra {
  return (valor) => (!valor.trim() || /^\d+$/.test(valor.trim()) ? null : mensagem);
}

/** Data no formato do input date (yyyy-MM-dd) e que exista no calendário. */
export function dataValida(mensagem: string): Regra {
  return (valor) => {
    if (!valor) return null;
    const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
    if (!partes) return mensagem;
    const [ano, mes, dia] = partes.slice(1).map(Number);
    const data = new Date(ano, mes - 1, dia);
    return data.getFullYear() === ano && data.getMonth() === mes - 1 && data.getDate() === dia
      ? null
      : mensagem;
  };
}
