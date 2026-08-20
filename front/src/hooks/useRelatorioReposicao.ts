"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  obterRelatorioReposicao,
  type RelatorioReposicao,
  type RelatorioReposicaoParams,
} from "@/services/relatoriosReposicao";
import { mensagemDeErro } from "@/lib/apiError";

export const JANELA_PADRAO = 30;
export const COBERTURA_PADRAO = 15;

// os dois campos de dias ficam como texto porque o input pode estar vazio no
// meio da digitacao, e vazio nao e zero
export interface FiltrosReposicao {
  categoriaId: number | null;
  janelaDias: string;
  coberturaDias: string;
}

export interface UseRelatorioReposicaoResult {
  relatorio: RelatorioReposicao | null;
  filtros: FiltrosReposicao;
  setFiltros: (parcial: Partial<FiltrosReposicao>) => void;
  loading: boolean;
  erro: string | null;
  recarregar: () => Promise<void>;
}

const FILTROS_INICIAIS: FiltrosReposicao = {
  categoriaId: null,
  janelaDias: String(JANELA_PADRAO),
  coberturaDias: String(COBERTURA_PADRAO),
};

function paraNumero(valor: string): number | null {
  return valor.trim() === "" ? null : Number(valor);
}

export function useRelatorioReposicao(): UseRelatorioReposicaoResult {
  const [relatorio, setRelatorio] = useState<RelatorioReposicao | null>(null);
  const [filtros, setFiltrosState] = useState<FiltrosReposicao>(FILTROS_INICIAIS);
  const [filtrosDebounced, setFiltrosDebounced] = useState<FiltrosReposicao>(FILTROS_INICIAIS);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const setFiltros = useCallback((parcial: Partial<FiltrosReposicao>) => {
    setFiltrosState((atual) => ({ ...atual, ...parcial }));
  }, []);

  // os dias sao digitados, entao espera parar de teclar antes de bater na API
  useEffect(() => {
    const t = setTimeout(() => setFiltrosDebounced(filtros), 300);
    return () => clearTimeout(t);
  }, [filtros]);

  const { categoriaId, janelaDias, coberturaDias } = filtrosDebounced;

  const carregar = useCallback(async (signal?: AbortSignal) => {
    const janela = paraNumero(janelaDias);
    const cobertura = paraNumero(coberturaDias);

    // campo vazio e alguem apagando pra digitar outro numero, nao e erro
    if (janela === null || cobertura === null) {
      setLoading(false);
      return;
    }

    // o back devolve 400 nesse caso; segurar aqui evita requisicao inutil a cada tecla
    if (janela < 1 || cobertura < 1) {
      setRelatorio(null);
      setErro("Informe pelo menos 1 dia na janela de análise e na cobertura.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setErro(null);
    try {
      const params: RelatorioReposicaoParams = { janelaDias: janela, coberturaDias: cobertura };
      if (categoriaId !== null) params.categoriaId = categoriaId;
      setRelatorio(await obterRelatorioReposicao(params, signal));
    } catch (err) {
      // cancelada porque o filtro mudou: quem manda e a busca nova, entao a tela fica como esta
      if (axios.isCancel(err)) return;
      setErro(mensagemDeErro(err, "Não foi possível carregar a sugestão de reposição."));
      setRelatorio(null);
    }
    setLoading(false);
  }, [categoriaId, janelaDias, coberturaDias]);

  // cancela a busca anterior antes de disparar a nova, senao a resposta lenta do
  // filtro antigo chega depois e sobrescreve a tela
  useEffect(() => {
    const controller = new AbortController();
    /* eslint-disable react-hooks/set-state-in-effect */
    carregar(controller.signal);
    /* eslint-enable react-hooks/set-state-in-effect */
    return () => controller.abort();
  }, [carregar]);

  return { relatorio, filtros, setFiltros, loading, erro, recarregar: carregar };
}
