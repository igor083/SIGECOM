// =============================================================
// hooks/useProdutos.ts — Hook de Controle de Produtos (SIGECOM)
// =============================================================
// Centraliza o estado dos produtos, carregamento, erros e as
// funções de mutação (cadastro, edição, exclusão, ajuste).
// Garante o isolamento entre UI e Serviços (driver D-5).
// =============================================================

import { useState, useEffect, useCallback } from "react";
import {
  listarProdutos,
  listarCategorias,
  criarProduto,
  editarProduto,
  excluirProduto,
  ajustarEstoque,
  type Produto,
  type CategoriaProduto,
  type PageProduto,
  type ProdutoRequest,
} from "@/services/produtos";
import { mensagemDeErro } from "@/lib/apiError";

export interface UseProdutosResult {
  produtosPage: PageProduto | null;
  categorias: CategoriaProduto[];
  loading: boolean;
  mutating: boolean;
  erro: string | null;
  
  // Filtros
  nome: string;
  setNome: (nome: string) => void;
  categoriaId: number | undefined;
  setCategoriaId: (id: number | undefined) => void;
  page: number;
  setPage: (page: number) => void;
  size: number;
  setSize: (size: number) => void;

  // Operações
  recarregar: () => Promise<void>;
  criar: (dados: ProdutoRequest) => Promise<Produto>;
  editar: (id: number, dados: ProdutoRequest) => Promise<Produto>;
  excluir: (id: number) => Promise<void>;
  ajustarEstoqueProduto: (id: number, quantidade: number) => Promise<Produto>;
}

export function useProdutos(initialSize = 10): UseProdutosResult {
  const [produtosPage, setProdutosPage] = useState<PageProduto | null>(null);
  const [categorias, setCategorias] = useState<CategoriaProduto[]>([]);
  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Estados de Filtro/Paginação
  const [nome, setNomeState] = useState("");
  const [categoriaId, setCategoriaIdState] = useState<number | undefined>(undefined);
  const [page, setPageState] = useState(0);
  const [size, setSizeState] = useState(initialSize);

  // Wrappers para resetar a página ao filtrar
  const setNome = useCallback((val: string) => {
    setNomeState(val);
    setPageState(0);
  }, []);

  const setCategoriaId = useCallback((val: number | undefined) => {
    setCategoriaIdState(val);
    setPageState(0);
  }, []);

  const setPage = useCallback((val: number) => {
    setPageState(val);
  }, []);

  const setSize = useCallback((val: number) => {
    setSizeState(val);
    setPageState(0);
  }, []);

  // ── Carregamento de Categorias ──────────────────────────────
  useEffect(() => {
    let active = true;
    async function fetchCats() {
      try {
        const data = await listarCategorias();
        if (active) {
          setCategorias(data);
        }
      } catch (err) {
        console.error("Erro ao carregar categorias", err);
      }
    }
    fetchCats();
    return () => {
      active = false;
    };
  }, []);

  // ── Carregamento de Produtos ─────────────────────────────────
  const carregarProdutos = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const data = await listarProdutos({
        nome: nome || undefined,
        categoriaId,
        page,
        size,
      });
      setProdutosPage(data);
    } catch (err) {
      setErro(mensagemDeErro(err, "Não foi possível carregar os produtos."));
      setProdutosPage(null);
    } finally {
      setLoading(false);
    }
  }, [nome, categoriaId, page, size]);

  // Recarrega sempre que filtros ou paginação mudarem
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    carregarProdutos();
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [carregarProdutos]);

  // ── Mutadores (Cadastro, Edição, Exclusão, Ajuste) ────────────

  const criar = useCallback(async (dados: ProdutoRequest) => {
    setMutating(true);
    setErro(null);
    try {
      const novoProduto = await criarProduto(dados);
      await carregarProdutos(); // atualiza a listagem
      return novoProduto;
    } catch (err) {
      const msg = mensagemDeErro(err, "Falha ao cadastrar o produto.");
      setErro(msg);
      throw new Error(msg);
    } finally {
      setMutating(false);
    }
  }, [carregarProdutos]);

  const editar = useCallback(async (id: number, dados: ProdutoRequest) => {
    setMutating(true);
    setErro(null);
    try {
      const produtoEditado = await editarProduto(id, dados);
      await carregarProdutos(); // atualiza a listagem
      return produtoEditado;
    } catch (err) {
      const msg = mensagemDeErro(err, "Falha ao editar o produto.");
      setErro(msg);
      throw new Error(msg);
    } finally {
      setMutating(false);
    }
  }, [carregarProdutos]);

  const excluir = useCallback(async (id: number) => {
    setMutating(true);
    setErro(null);
    try {
      await excluirProduto(id);
      await carregarProdutos(); // atualiza a listagem
    } catch (err) {
      const msg = mensagemDeErro(err, "Falha ao excluir o produto.");
      setErro(msg);
      throw new Error(msg);
    } finally {
      setMutating(false);
    }
  }, [carregarProdutos]);

  const ajustarEstoqueProduto = useCallback(async (id: number, quantidade: number) => {
    setMutating(true);
    setErro(null);
    try {
      const produtoAjustado = await ajustarEstoque(id, quantidade);
      await carregarProdutos(); // atualiza a listagem
      return produtoAjustado;
    } catch (err) {
      const msg = mensagemDeErro(err, "Falha ao ajustar o estoque do produto.");
      setErro(msg);
      throw new Error(msg);
    } finally {
      setMutating(false);
    }
  }, [carregarProdutos]);

  return {
    produtosPage,
    categorias,
    loading,
    mutating,
    erro,
    nome,
    setNome,
    categoriaId,
    setCategoriaId,
    page,
    setPage,
    size,
    setSize,
    recarregar: carregarProdutos,
    criar,
    editar,
    excluir,
    ajustarEstoqueProduto,
  };
}
