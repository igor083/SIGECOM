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
  tipo: TipoLancamento | undefined; // undefined = receitas e despesas juntas
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
 * Tela unificada: lista receitas e despesas juntas. O tipo é filtro
 * (em `filtros.tipo`), não parâmetro fixo — quem escolhe o tipo de um
 * novo lançamento é o FormLancamento.
 */
// aoRegistrar: chamado depois de gravar com sucesso. A pagina passa o recarregar
// do useSaldo aqui, e o painel se atualiza sozinho (criterio 3 do card).
export function useLancamentos(
  aoRegistrar?: () => void
): UseLancamentosResult {
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
    tipo: undefined,
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
  // Carrega TODAS as categorias (receita e despesa) uma vez. O FormLancamento
  // filtra pelo tipo escolhido no cliente — evita recarregar a cada troca de tipo.
  // Erro exposto em erroCategorias para que a tela desabilite o formulário
  // e mostre a causa — select vazio sem mensagem é a pior falha silenciosa.
  useEffect(() => {
    let active = true;
    async function fetchCategorias() {
      setErroCategorias(null);
      try {
        const data = await listarCategoriasFinanceiras();
        if (active) setCategorias(data);
      } catch (err) {
        console.error("Erro ao carregar categorias financeiras", err);
        if (active) setErroCategorias(mensagemDeErro(err, "Não foi possível carregar as categorias."));
      }
    }
    fetchCategorias();
    return () => { active = false; };
  }, []);

  // ── Carregamento de lançamentos ──────────────────────────────
  const carregarLancamentos = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const data = await listarLancamentos({
        tipo: filtros.tipo,                            // undefined → receitas e despesas
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
  }, [filtros, page]);

  // Recarrega sempre que filtros ou paginação mudam
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    carregarLancamentos();
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [carregarLancamentos]);

  // ── Mutador: registrar lançamento ────────────────────────────
  // Após sucesso, recarrega a lista para o lançamento aparecer
  // imediatamente, sem recarregar a página. (critério 2 do card)
  // Erro de registro não vai para setErro (que apagaria a listagem);
  // o throw devolve a mensagem para o FormLancamento exibir no lugar certo.
  const registrar = useCallback(async (req: LancamentoRequest): Promise<LancamentoResponse> => {
    setMutando(true);
    try {
      const novo = await registrarLancamento(req);
      await carregarLancamentos(); // D-5: atualiza a lista sem recarregar a página
      aoRegistrar?.();             // avisa quem quiser reagir, hoje so o saldo
      return novo;
    } catch (err) {
      const msg = mensagemDeErro(err, "Falha ao registrar o lançamento.");
      throw new Error(msg); // FormLancamento captura e exibe dentro do formulário
    } finally {
      setMutando(false);
    }
  }, [carregarLancamentos, aoRegistrar]);

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
