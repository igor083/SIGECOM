// =============================================================
// hooks/useBuscaProduto.ts — Busca rápida de produtos para PDV
// =============================================================
// Hook leve e focado no fluxo de PDV: busca com debounce,
// reuso do service existente, tratamento de erro via apiError.
// Diferente do useProdutos (CRUD completo com paginação),
// este retorna apenas os resultados da busca por nome.
//
// Driver D-5 — Manutenibilidade: componente não chama API
// direto; toda lógica de estado e fetch fica aqui.
// =============================================================

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { listarProdutos, type Produto } from "@/services/produtos";
import { mensagemDeErro } from "@/lib/apiError";

// ── Tipos ────────────────────────────────────────────────────

export interface UseBuscaProdutoResult {
  /** Termo digitado pelo operador. */
  termo: string;
  /** Atualiza o termo de busca (dispara debounce). */
  setTermo: (valor: string) => void;
  /** Produtos retornados pela busca. */
  resultados: Produto[];
  /** true enquanto a requisição está em andamento. */
  carregando: boolean;
  /** Mensagem de erro amigável, ou null. */
  erro: string | null;
}

// ── Constantes ───────────────────────────────────────────────

/** Tempo de debounce em milissegundos. */
const DEBOUNCE_MS = 300;

/** Mínimo de caracteres para disparar a busca. */
const MIN_CHARS = 2;

/** Quantidade máxima de resultados por busca. */
const PAGE_SIZE = 8;

// ── Hook ─────────────────────────────────────────────────────

/**
 * Busca rápida de produtos por nome com debounce.
 *
 * Só dispara a requisição quando o termo tem 2+ caracteres.
 * Termo vazio ou curto limpa os resultados imediatamente.
 *
 * @example
 * const { termo, setTermo, resultados, carregando, erro } = useBuscaProduto();
 */
export function useBuscaProduto(): UseBuscaProdutoResult {
  const [termo, setTermo] = useState("");
  const [termoDebounced, setTermoDebounced] = useState("");
  const [resultados, setResultados] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Ref para cancelar buscas obsoletas (race condition)
  const buscaIdRef = useRef(0);

  // ── Debounce do termo ──────────────────────────────────────
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    // Termo curto: limpa resultados imediatamente, sem debounce
    if (termo.trim().length < MIN_CHARS) {
      setTermoDebounced("");
      setResultados([]);
      setErro(null);
      setCarregando(false);
      return;
    }

    const timer = setTimeout(() => {
      setTermoDebounced(termo.trim());
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [termo]);

  // ── Fetch quando o termo debounced muda ────────────────────
  useEffect(() => {
    if (!termoDebounced) return;

    const idAtual = ++buscaIdRef.current;

    async function buscar() {
      setCarregando(true);
      setErro(null);

      try {
        const pagina = await listarProdutos({
          nome: termoDebounced,
          size: PAGE_SIZE,
        });

        // Ignora resposta se outra busca já foi disparada
        if (idAtual !== buscaIdRef.current) return;

        setResultados(pagina.content);
      } catch (err) {
        if (idAtual !== buscaIdRef.current) return;

        setResultados([]);
        setErro(
          mensagemDeErro(err, "Não foi possível buscar os produtos.")
        );
      } finally {
        if (idAtual === buscaIdRef.current) {
          setCarregando(false);
        }
      }
    }

    buscar();
  }, [termoDebounced]);

  // Wrapper estável para setTermo
  const handleSetTermo = useCallback((valor: string) => {
    setTermo(valor);
  }, []);

  return {
    termo,
    setTermo: handleSetTermo,
    resultados,
    carregando,
    erro,
  };
}
