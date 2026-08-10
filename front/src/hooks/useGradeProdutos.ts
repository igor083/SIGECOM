// =============================================================
// hooks/useGradeProdutos.ts — Catálogo em grade do PDV (SCRUM-160)
// =============================================================
// Carrega os produtos ativos uma vez e filtra em memória por
// categoria e por nome. Filtrar no cliente evita uma ida à API
// a cada tecla e a cada troca de aba — o catálogo do lojista é
// pequeno o bastante para caber numa página.
//
// Driver D-5: o componente nunca chama a API direto, só este hook.
// =============================================================

"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { listarProdutos, type Produto } from "@/services/produtos";
import { mensagemDeErro } from "@/lib/apiError";

/** Aba "Todos" não filtra por categoria. */
export const CATEGORIA_TODOS = "TODOS";

export interface AbaCategoria {
  chave: string;
  rotulo: string;
  quantidade: number;
}

export interface UseGradeProdutosResult {
  produtos: Produto[];
  abas: AbaCategoria[];
  categoriaAtiva: string;
  selecionarCategoria: (chave: string) => void;
  termo: string;
  setTermo: (valor: string) => void;
  carregando: boolean;
  erro: string | null;
  recarregar: () => Promise<void>;
}

// Uma página grande basta: o catálogo é pequeno e a grade não pagina.
const TAMANHO_PAGINA = 200;

export function useGradeProdutos(): UseGradeProdutosResult {
  const [todos, setTodos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>(CATEGORIA_TODOS);
  const [termo, setTermo] = useState("");

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const pagina = await listarProdutos({ size: TAMANHO_PAGINA });
      // produto desativado não entra no PDV
      setTodos(pagina.content.filter((p) => p.ativo));
    } catch (err) {
      setErro(mensagemDeErro(err, "Não foi possível carregar os produtos."));
      setTodos([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    carregar();
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [carregar]);

  // Abas saem das categorias que realmente têm produto, não de um enum fixo.
  const abas = useMemo<AbaCategoria[]>(() => {
    const porCategoria = new Map<string, number>();
    for (const p of todos) {
      const nome = p.categoria?.nome ?? "Sem categoria";
      porCategoria.set(nome, (porCategoria.get(nome) ?? 0) + 1);
    }
    const ordenadas = [...porCategoria.entries()].sort((a, b) =>
      a[0].localeCompare(b[0], "pt-BR")
    );
    return [
      { chave: CATEGORIA_TODOS, rotulo: "Todos", quantidade: todos.length },
      ...ordenadas.map(([nome, quantidade]) => ({ chave: nome, rotulo: nome, quantidade })),
    ];
  }, [todos]);

  const produtos = useMemo(() => {
    const busca = termo.trim().toLowerCase();
    return todos.filter((p) => {
      const daCategoria =
        categoriaAtiva === CATEGORIA_TODOS ||
        (p.categoria?.nome ?? "Sem categoria") === categoriaAtiva;
      const doTermo = busca === "" || p.nome.toLowerCase().includes(busca);
      return daCategoria && doTermo;
    });
  }, [todos, categoriaAtiva, termo]);

  const selecionarCategoria = useCallback((chave: string) => setCategoriaAtiva(chave), []);

  return {
    produtos,
    abas,
    categoriaAtiva,
    selecionarCategoria,
    termo,
    setTermo,
    carregando,
    erro,
    recarregar: carregar,
  };
}
