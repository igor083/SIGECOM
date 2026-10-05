"use client";

// Validação de formulário ao sair do campo (ISO 9241-17, 6.4.2 e 7.3).
//
// - O erro só aparece em campo já visitado (blur) ou depois de uma
//   tentativa de envio: quem ainda não passou pelo campo não leva bronca.
// - O erro é derivado do valor atual, não guardado: some assim que o
//   valor fica válido, sem precisar sair do campo de novo.
// - validarTudo() marca todos como visitados e põe o foco no primeiro
//   inválido, na ordem em que `campos` foi declarado (= ordem da tela).

import { useEffect, useRef, useState } from "react";
import type { Regra } from "@/lib/validacao";

export interface CampoValidado {
  /** id do elemento na tela; usado no foco e no aria-describedby. */
  id: string;
  regra: Regra;
}

export function idErro(idCampo: string): string {
  return `${idCampo}-erro`;
}

export function useValidacaoFormulario<C extends string>(
  campos: Record<C, CampoValidado>,
  valores: Record<C, string>,
) {
  const [visitados, setVisitados] = useState<Partial<Record<C, boolean>>>({});

  // O foco vai para o campo depois do render, quando a mensagem de erro
  // já existe e o leitor de tela consegue lê-la pelo aria-describedby.
  const focoPendente = useRef<string | null>(null);
  useEffect(() => {
    if (!focoPendente.current) return;
    document.getElementById(focoPendente.current)?.focus();
    focoPendente.current = null;
  });

  function mensagem(campo: C): string | null {
    return visitados[campo] ? campos[campo].regra(valores[campo]) : null;
  }

  function propsCampo(campo: C) {
    const erro = mensagem(campo);
    return {
      onBlur: () => setVisitados((v) => (v[campo] ? v : { ...v, [campo]: true })),
      "aria-invalid": erro ? true : undefined,
      "aria-describedby": erro ? idErro(campos[campo].id) : undefined,
    };
  }

  /** Valida todos os campos; devolve true se o formulário pode ser enviado. */
  function validarTudo(): boolean {
    const nomes = Object.keys(campos) as C[];
    setVisitados(Object.fromEntries(nomes.map((n) => [n, true])) as Record<C, boolean>);
    const primeiroInvalido = nomes.find((n) => campos[n].regra(valores[n]));
    if (primeiroInvalido) focoPendente.current = campos[primeiroInvalido].id;
    return !primeiroInvalido;
  }

  /** Esquece os campos visitados (ao abrir o formulário ou depois de salvar). */
  function limpar() {
    setVisitados({});
  }

  return { mensagem, propsCampo, validarTudo, limpar };
}
