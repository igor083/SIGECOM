"use client";

import { useCallback, useEffect, useState } from "react";
import {
  obterRelatorioMovimentacao,
  type RelatorioMovimentacao,
  type RelatorioMovimentacaoParams,
} from "@/services/relatoriosMovimentacao";
import type { PeriodoRelatorio } from "@/services/relatorios";
import { mensagemDeErro } from "@/lib/apiError";

export type ModoPeriodo = PeriodoRelatorio | "PERSONALIZADO";

interface Opcoes {
  produtoInicial?: number | null;
}

export function useRelatorioMovimentacao({ produtoInicial = null }: Opcoes = {}) {
  const [relatorio, setRelatorio] = useState<RelatorioMovimentacao | null>(null);
  const [modo, setModo] = useState<ModoPeriodo>("MES");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [produtoId, setProdutoId] = useState<number | null>(produtoInicial);
  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const aguardandoDatas = modo === "PERSONALIZADO" && (!dataInicio || !dataFim);

  const carregar = useCallback(async () => {
    if (aguardandoDatas) return;

    setLoading(true);
    setErro(null);
    try {
      const params: RelatorioMovimentacaoParams =
        modo === "PERSONALIZADO" ? { dataInicio, dataFim } : { periodo: modo };
      if (produtoId !== null) params.produtoId = produtoId;
      if (categoriaId !== null) params.categoriaId = categoriaId;

      setRelatorio(await obterRelatorioMovimentacao(params));
    } catch (err) {
      setErro(mensagemDeErro(err, "Não foi possível carregar as movimentações."));
      setRelatorio(null);
    } finally {
      setLoading(false);
    }
  }, [modo, dataInicio, dataFim, produtoId, categoriaId, aguardandoDatas]);

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
    produtoId,
    setProdutoId,
    categoriaId,
    setCategoriaId,
    loading,
    erro,
    aguardandoDatas,
    recarregar: carregar,
  };
}
