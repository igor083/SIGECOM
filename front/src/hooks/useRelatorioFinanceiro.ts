"use client";

import { useState, useEffect, useCallback } from "react";
import {
  obterRelatorioFinanceiro,
  type RelatorioFinanceiro,
  type RelatorioFinanceiroParams,
} from "@/services/relatorios";
import { mensagemDeErro } from "@/lib/apiError";
// reexporta em vez de redeclarar — consistência entre relatórios
export type { ModoPeriodo } from "./useRelatorioVendas";
import type { ModoPeriodo } from "./useRelatorioVendas";

export interface UseRelatorioFinanceiroResult {
  relatorio: RelatorioFinanceiro | null;
  modo: ModoPeriodo;
  setModo: (m: ModoPeriodo) => void;
  dataInicio: string;
  setDataInicio: (d: string) => void;
  dataFim: string;
  setDataFim: (d: string) => void;
  categoriaId: number | null;
  setCategoriaId: (id: number | null) => void;
  loading: boolean;
  erro: string | null;
  aguardandoDatas: boolean;
  recarregar: () => Promise<void>;
}

export function useRelatorioFinanceiro(
  modoInicial: ModoPeriodo = "MES"
): UseRelatorioFinanceiroResult {
  const [relatorio, setRelatorio] = useState<RelatorioFinanceiro | null>(null);
  const [modo, setModo] = useState<ModoPeriodo>(modoInicial);
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const aguardandoDatas =
    modo === "PERSONALIZADO" && (!dataInicio || !dataFim);

  const carregar = useCallback(async () => {
    if (aguardandoDatas) return;

    setLoading(true);
    setErro(null);
    try {
      const params: RelatorioFinanceiroParams =
        modo === "PERSONALIZADO"
          ? { dataInicio, dataFim }
          : { periodo: modo };

      if (categoriaId !== null) {
        params.categoriaId = categoriaId;
      }

      setRelatorio(await obterRelatorioFinanceiro(params));
    } catch (err) {
      setErro(mensagemDeErro(err, "Não foi possível carregar o relatório."));
      setRelatorio(null);
    } finally {
      setLoading(false);
    }
  }, [modo, dataInicio, dataFim, categoriaId, aguardandoDatas]);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    carregar();
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [carregar]);

  return {
    relatorio,
    modo,
    setModo,
    dataInicio,
    setDataInicio,
    dataFim,
    setDataFim,
    categoriaId,
    setCategoriaId,
    loading,
    erro,
    aguardandoDatas,
    recarregar: carregar,
  };
}
