// D-5: Caixa consome este hook, nunca service

import { useState, useEffect, useCallback } from "react";
import { obterPreviewFechamento, confirmarFechamento, type Fechamento } from "@/services/fechamento";
import { mensagemDeErro } from "@/lib/apiError";

export interface UseFechamentoResult {
  fechamento: Fechamento | null;
  jaFechado: boolean;
  loading: boolean;
  erro: string | null;
  confirmando: boolean;
  erroConfirmar: string | null;
  confirmar: (valorFisicoInformado: number, fundoTroco: number) => Promise<void>;
}

export function useFechamento(): UseFechamentoResult {
  // Um único estado para os dois casos, o "caixa fechado" sumia
  const [fechamento, setFechamento] = useState<Fechamento | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [confirmando, setConfirmando] = useState(false);
  const [erroConfirmar, setErroConfirmar] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      setFechamento(await obterPreviewFechamento());
    } catch (err) {
      setErro(mensagemDeErro(err, "Não foi possível calcular o fechamento do dia."));
      setFechamento(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    carregar();
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [carregar]);

  const confirmar = useCallback(async (valorFisicoInformado: number, fundoTroco: number) => {
    setConfirmando(true);
    setErroConfirmar(null);
    try {
      setFechamento(await confirmarFechamento(valorFisicoInformado, fundoTroco));
    } catch (err) {
      setErroConfirmar(mensagemDeErro(err, "Não foi possível confirmar o fechamento."));
    } finally {
      setConfirmando(false);
    }
  }, []);

  return {
    fechamento,
    jaFechado: fechamento?.fechadoEm != null,
    loading,
    erro,
    confirmando,
    erroConfirmar,
    confirmar,
  };
}
