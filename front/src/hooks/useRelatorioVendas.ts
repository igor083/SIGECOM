"use client";

// D-5: quem fala com a API de relatório é este hook; a página/o componente só exibem.
// Espelha o useSaldo, mas delega o cálculo do preset (dia/semana/mês) ao backend
// e só monta o intervalo manualmente no modo PERSONALIZADO.

import { useState, useEffect, useCallback } from "react";
import {
  obterRelatorioVendas,
  type PeriodoRelatorio,
  type RelatorioVendas,
  type RelatorioVendasParams,
} from "@/services/relatorios";
import { mensagemDeErro } from "@/lib/apiError";

export type ModoPeriodo = PeriodoRelatorio | "PERSONALIZADO";

export interface UseRelatorioVendasResult {
  relatorio: RelatorioVendas | null;
  modo: ModoPeriodo;
  setModo: (m: ModoPeriodo) => void;
  dataInicio: string;
  setDataInicio: (d: string) => void;
  dataFim: string;
  setDataFim: (d: string) => void;
  funcionarioId: number | null;
  setFuncionarioId: (id: number | null) => void;
  loading: boolean;
  erro: string | null;
  /** true quando o modo é PERSONALIZADO mas ainda falta uma das datas. */
  aguardandoDatas: boolean;
  recarregar: () => Promise<void>;
}

export function useRelatorioVendas(
  modoInicial: ModoPeriodo = "MES"
): UseRelatorioVendasResult {
  const [relatorio, setRelatorio] = useState<RelatorioVendas | null>(null);
  const [modo, setModo] = useState<ModoPeriodo>(modoInicial);
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [funcionarioId, setFuncionarioId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // No modo personalizado precisamos das duas datas antes de consultar.
  const aguardandoDatas =
    modo === "PERSONALIZADO" && (!dataInicio || !dataFim);

  const carregar = useCallback(async () => {
    if (aguardandoDatas) return; // evita chamada 400 com par de datas incompleto

    setLoading(true);
    setErro(null);
    try {
      const params: RelatorioVendasParams =
        modo === "PERSONALIZADO"
          ? { dataInicio, dataFim }
          : { periodo: modo };

      if (funcionarioId !== null) {
        params.funcionarioId = funcionarioId;
      }

      setRelatorio(await obterRelatorioVendas(params));
    } catch (err) {
      setErro(mensagemDeErro(err, "Não foi possível carregar o relatório."));
      setRelatorio(null);
    } finally {
      setLoading(false);
    }
  }, [modo, dataInicio, dataFim, funcionarioId, aguardandoDatas]);

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
    funcionarioId,
    setFuncionarioId,
    loading,
    erro,
    aguardandoDatas,
    recarregar: carregar,
  };
}
