// =============================================================
// hooks/useGradeProdutos.ts — Catálogo em grade do PDV (SCRUM-160)
// =============================================================
// Carrega a primeira página de produtos ativos para montar a grade
// e as abas. A BUSCA POR NOME continua indo na API, como fazia o
// useBuscaProduto: filtrar só em memória esconderia qualquer produto
// fora da primeira página, e o operador veria "nenhum produto
// encontrado" para um produto que existe. Falha silenciosa em cima
// do caixa é o pior tipo de bug aqui.
//
// Driver D-5: o componente nunca chama a API direto, só este hook.
// =============================================================

"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { listarProdutos, type Produto } from "@/services/produtos";
import { mensagemDeErro } from "@/lib/apiError";

/** Aba "Todos" não filtra por categoria. */
export const CATEGORIA_TODOS = -1;

export interface AbaCategoria {
  chave: number;
  rotulo: string;
  quantidade: number;
}

export interface UseGradeProdutosResult {
  produtos: Produto[];
  abas: AbaCategoria[];
  categoriaAtiva: number;
  selecionarCategoria: (chave: number) => void;
  termo: string;
  setTermo: (valor: string) => void;
  carregando: boolean;
  buscando: boolean;
  erro: string | null;
  /** true quando existe produto fora da página carregada. */
  catalogoTruncado: boolean;
  totalNoCatalogo: number;
  recarregar: () => Promise<void>;
}

const TAMANHO_PAGINA = 200;
const MIN_CARACTERES_BUSCA = 2;
const DEBOUNCE_MS = 300;

export function useGradeProdutos(versao: number = 0): UseGradeProdutosResult {
  const [todos, setTodos] = useState<Produto[]>([]);
  const [total, setTotal] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [categoriaAtiva, setCategoriaAtiva] = useState<number>(CATEGORIA_TODOS);
  const [termo, setTermo] = useState("");

  // Resultado da busca server-side, carimbado com o termo que o produziu.
  // Carimbar evita ter que limpar o estado dentro do efeito e deixa
  // "ainda estou buscando" ser derivado, em vez de mais um estado.
  const [resultadoBusca, setResultadoBusca] = useState<{
    termo: string;
    itens: Produto[];
  } | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const pagina = await listarProdutos({ size: TAMANHO_PAGINA });
      setTodos(pagina.content.filter((p) => p.ativo));
      setTotal(pagina.totalElements);
    } catch (err) {
      setErro(mensagemDeErro(err, "Não foi possível carregar os produtos."));
      setTodos([]);
      setTotal(0);
    } finally {
      setCarregando(false);
    }
  }, []);

  // `versao` deixa o pai forçar recarga — depois de uma venda o estoque mudou.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    carregar();
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [carregar, versao]);

  // Busca na API, com debounce, exatamente como a busca antiga fazia.
  const requisicaoAtual = useRef(0);
  const termoBusca = termo.trim();
  const buscaAtiva = termoBusca.length >= MIN_CARACTERES_BUSCA;

  useEffect(() => {
    if (!buscaAtiva) return;

    const id = ++requisicaoAtual.current;
    const timer = setTimeout(async () => {
      try {
        const pagina = await listarProdutos({ nome: termoBusca, size: TAMANHO_PAGINA });
        // descarta resposta de busca antiga que chegou fora de ordem
        if (id !== requisicaoAtual.current) return;
        setResultadoBusca({ termo: termoBusca, itens: pagina.content.filter((p) => p.ativo) });
      } catch (err) {
        if (id !== requisicaoAtual.current) return;
        setErro(mensagemDeErro(err, "Não foi possível buscar os produtos."));
        setResultadoBusca({ termo: termoBusca, itens: [] });
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [termoBusca, buscaAtiva]);

  // o resultado só vale para o termo que está no campo agora
  const buscaResolvida = buscaAtiva && resultadoBusca?.termo === termoBusca;
  const buscando = buscaAtiva && !buscaResolvida;

  // Abas saem das categorias que realmente têm produto, não de um enum fixo.
  // Chave é o id: duas categorias com o mesmo nome não podem virar uma aba só.
  const abas = useMemo<AbaCategoria[]>(() => {
    const porId = new Map<number, { nome: string; quantidade: number }>();
    for (const p of todos) {
      const id = p.categoria?.id;
      if (id == null) continue;
      const atual = porId.get(id);
      porId.set(id, {
        nome: p.categoria.nome,
        quantidade: (atual?.quantidade ?? 0) + 1,
      });
    }
    const ordenadas = [...porId.entries()].sort((a, b) =>
      a[1].nome.localeCompare(b[1].nome, "pt-BR")
    );
    return [
      { chave: CATEGORIA_TODOS, rotulo: "Todos", quantidade: todos.length },
      ...ordenadas.map(([id, v]) => ({ chave: id, rotulo: v.nome, quantidade: v.quantidade })),
    ];
  }, [todos]);

  const produtos = useMemo(() => {
    // com busca ativa manda o que veio da API; senão, o catálogo carregado
    const base = buscaResolvida ? resultadoBusca!.itens : todos;
    if (categoriaAtiva === CATEGORIA_TODOS) return base;
    return base.filter((p) => p.categoria?.id === categoriaAtiva);
  }, [todos, resultadoBusca, buscaResolvida, categoriaAtiva]);

  const selecionarCategoria = useCallback((chave: number) => setCategoriaAtiva(chave), []);

  return {
    produtos,
    abas,
    categoriaAtiva,
    selecionarCategoria,
    termo,
    setTermo,
    carregando,
    buscando,
    erro,
    // avisa em vez de esconder: catálogo grande demais para uma página só
    catalogoTruncado: total > todos.length,
    totalNoCatalogo: total,
    recarregar: carregar,
  };
}
