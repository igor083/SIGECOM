"use client";

import { useCallback, useEffect, useState } from "react";
import {
  obterRelatorioEstoque,
  type OrdenacaoEstoque,
  type RelatorioEstoque,
  type RelatorioEstoqueParams,
} from "@/services/relatoriosEstoque";
import { mensagemDeErro } from "@/lib/apiError";

export interface UseRelatorioEstoqueResult {
  relatorio: RelatorioEstoque | null;
  categoriaId: number | null;
  setCategoriaId: (id: number | null) => void;
  busca: string;
  setBusca: (b: string) => void;
  ordenacao: OrdenacaoEstoque;
  setOrdenacao: (o: OrdenacaoEstoque) => void;
  loading: boolean;
  erro: string | null;
  recarregar: () => Promise<void>;
}

export function useRelatorioEstoque(): UseRelatorioEstoqueResult {
  const [relatorio, setRelatorio] = useState<RelatorioEstoque | null>(null);
  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [busca, setBusca] = useState("");
  const [buscaDebounced, setBuscaDebounced] = useState("");
  const [ordenacao, setOrdenacao] = useState<OrdenacaoEstoque>("QUANTIDADE_ASC");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setBuscaDebounced(busca), 300);
    return () => clearTimeout(t);
  }, [busca]);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const params: RelatorioEstoqueParams = { ordenacao };
      if (categoriaId !== null) params.categoriaId = categoriaId;
      if (buscaDebounced.trim()) params.busca = buscaDebounced.trim();
      setRelatorio(await obterRelatorioEstoque(params));
    } catch (err) {
      setErro(mensagemDeErro(err, "Não foi possível carregar o relatório de estoque."));
      setRelatorio(null);
    } finally {
      setLoading(false);
    }
  }, [categoriaId, buscaDebounced, ordenacao]);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    carregar();
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [carregar]);

  return {
    relatorio,
    categoriaId,
    setCategoriaId,
    busca,
    setBusca,
    ordenacao,
    setOrdenacao,
    loading,
    erro,
    recarregar: carregar,
  };
}
