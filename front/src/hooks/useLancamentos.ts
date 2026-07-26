// =============================================================
// hooks/useLancamentos.ts — Hook do módulo Financeiro (SIGECOM)
// =============================================================
// Centraliza o estado de lançamentos financeiros, filtros,
// paginação e categorias. Componentes consomem este hook e
// nunca chamam o service diretamente. (driver D-5)
// =============================================================
// D-5: todo acesso à API de lançamentos passa por este hook.
//      FormLancamento e a página de Financeiro não importam
//      nada de services/lancamentos.ts — só este hook.
// =============================================================

import { useState, useEffect, useCallback } from "react";
import {
  listarLancamentos,
  registrarLancamento,
  listarCategoriasFinanceiras,
  type TipoLancamento,
  type CategoriaFinanceira,
  type LancamentoResponse,
  type LancamentoRequest,
  type PageLancamento,
} from "@/services/lancamentos";
import { mensagemDeErro } from "@/lib/apiError";

// ── Tipos públicos ─────────────────────────────────────────────

export interface FiltrosLancamento {
  categoriaId: number | undefined;
  dataInicio: string; // yyyy-MM-dd ou ""
  dataFim: string;    // yyyy-MM-dd ou ""
}

export interface UseLancamentosResult {
  // Dados
  lancamentosPage: PageLancamento | null;
  categorias: CategoriaFinanceira[];   // D-5: exposto aqui para que o FormLancamento não chame o service

  // Estado de UI
  loading: boolean;
  mutando: boolean;
  erro: string | null;
  erroCategorias: string | null; // falha no carregamento do select de categoria — visível na tela

  // Filtros e paginação
  filtros: FiltrosLancamento;
  setFiltros: (filtros: Partial<FiltrosLancamento>) => void;
  page: number;
  setPage: (page: number) => void;

  // Ações
  recarregar: () => Promise<void>;
  registrar: (req: LancamentoRequest) => Promise<LancamentoResponse>;
}

// ── Hook ───────────────────────────────────────────────────────

/**
 * Hook principal do módulo Financeiro.
 *
 * @param tipo  "DESPESA" ou "RECEITA" — parametrizado para que o
 *              Igor reaproveite no SCRUM-21 passando "RECEITA".
 */
export function useLancamentos(tipo: TipoLancamento): UseLancamentosResult {
  // ── Estado de dados ──────────────────────────────────────────
  const [lancamentosPage, setLancamentosPage] = useState<PageLancamento | null>(null);
  const [categorias, setCategorias] = useState<CategoriaFinanceira[]>([]);

  // ── Estado de UI ─────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [mutando, setMutando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [erroCategorias, setErroCategorias] = useState<string | null>(null);

  // ── Filtros e paginação ──────────────────────────────────────
  const [filtros, setFiltrosState] = useState<FiltrosLancamento>({
    categoriaId: undefined,
    dataInicio: "",
    dataFim: "",
  });
  const [page, setPageState] = useState(0);

  // Wrapper de filtros: merge parcial e reseta a página
  const setFiltros = useCallback((parcial: Partial<FiltrosLancamento>) => {
    setFiltrosState((prev) => ({ ...prev, ...parcial }));
    setPageState(0);
  }, []);

  const setPage = useCallback((val: number) => {
    setPageState(val);
  }, []);

  // ── Carregamento de categorias ───────────────────────────────
  // Roda quando o tipo muda (RECEITA ↔ DESPESA).
  // Erro exposto em erroCategorias para que a tela desabilite o formulário
  // e mostre a causa — select vazio sem mensagem é a pior falha silenciosa.
  useEffect(() => {
    let active = true;
    async function fetchCategorias() {
      /* eslint-disable react-hooks/set-state-in-effect */
      setErroCategorias(null);
      /* eslint-enable react-hooks/set-state-in-effect */
      try {
        const data = await listarCategoriasFinanceiras(tipo);
        if (active) setCategorias(data);
      } catch (err) {
        console.error("Erro ao carregar categorias financeiras", err);
        if (active) setErroCategorias(mensagemDeErro(err, "Não foi possível carregar as categorias."));
      }
    }
    fetchCategorias();
    return () => { active = false; };
  }, [tipo]);

  // ── Carregamento de lançamentos ──────────────────────────────
  const carregarLancamentos = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const data = await listarLancamentos({
        tipo,
        categoriaId: filtros.categoriaId,
        dataInicio: filtros.dataInicio || undefined,  // string vazia → não filtra
        dataFim: filtros.dataFim || undefined,
        page,
        size: 10,
      });
      setLancamentosPage(data);
    } catch (err) {
      setErro(mensagemDeErro(err, "Não foi possível carregar os lançamentos."));
      setLancamentosPage(null);
    } finally {
      setLoading(false);
    }
  }, [tipo, filtros, page]);

  // Recarrega sempre que filtros, paginação ou tipo mudam
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    carregarLancamentos();
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [carregarLancamentos]);

  // ── Mutador: registrar lançamento ────────────────────────────
  // Após sucesso, recarrega a lista para o lançamento aparecer
  // imediatamente, sem recarregar a página. (critério 2 do card)
  const registrar = useCallback(async (req: LancamentoRequest): Promise<LancamentoResponse> => {
    setMutando(true);
    setErro(null);
    try {
      const novo = await registrarLancamento(req);
      await carregarLancamentos(); // D-5: atualiza a lista sem recarregar a página
      return novo;
    } catch (err) {
      const msg = mensagemDeErro(err, "Falha ao registrar o lançamento.");
      setErro(msg);
      throw new Error(msg);
    } finally {
      setMutando(false);
    }
  }, [carregarLancamentos]);

  // ── Retorno público ──────────────────────────────────────────
  return {
    lancamentosPage,
    categorias,       // D-5: FormLancamento consome daqui, nunca do service
    loading,
    mutando,
    erro,
    erroCategorias,
    filtros,
    setFiltros,
    page,
    setPage,
    recarregar: carregarLancamentos,
    registrar,
  };
}
