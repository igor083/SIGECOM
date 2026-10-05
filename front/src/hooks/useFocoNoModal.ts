"use client";

// Foco de teclado em modal (ISO 9241-17, 8.2 e 8.4).
//
// Sem isto, ao abrir o modal o foco ficava no botão da página que o
// abriu, atrás do overlay: o Tab percorria busca, filtros e tabela
// escondidos antes de chegar ao primeiro campo, e depois do último
// botão saía do modal de novo.
//
// - ao abrir, foca o primeiro campo (input/select/textarea);
// - Tab no último elemento volta ao primeiro, Shift+Tab no primeiro
//   vai ao último; se o foco se perdeu (ex.: botão que sumiu da tela),
//   o próximo Tab volta para dentro do modal;
// - ao fechar, devolve o foco a quem abriu o modal.
//
// A ordem entre os campos continua sendo a do DOM: nada de tabindex positivo.

import { useEffect, useRef } from "react";

const FOCAVEIS = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

export function useFocoNoModal<T extends HTMLElement>(aberto: boolean) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const modal = ref.current;
    if (!aberto || !modal) return;

    const anterior = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    modal.querySelector<HTMLElement>("input:not([disabled]), select:not([disabled]), textarea:not([disabled])")?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Tab" || !modal) return;
      const focaveis = Array.from(modal.querySelectorAll<HTMLElement>(FOCAVEIS));
      if (focaveis.length === 0) return;
      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];
      const atual = document.activeElement;

      if (!modal.contains(atual)) {
        e.preventDefault();
        (e.shiftKey ? ultimo : primeiro).focus();
      } else if (e.shiftKey && atual === primeiro) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && atual === ultimo) {
        e.preventDefault();
        primeiro.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      anterior?.focus();
    };
  }, [aberto]);

  return ref;
}
