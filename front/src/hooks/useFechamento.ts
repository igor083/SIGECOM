// D-5: Caixa consome este hook, nunca service

import { useState, useEffect, useCallback } from "react";
import { obterPreviewFechamento, confirmarFechamento, type Fechamento } from "@/services/fechamento";
import { mensagemDeErro } from "@/lib/apiError";

export interface UseFechamentoResult {
  preview: Fechamento | null;
  loading: boolean;
  erro: string | null;
  confirmando: boolean;
  erroConfirmar: string | null;
  fechamentoConfirmado: Fechamento | null;
  confirmar: (valorFisicoInformado: number) => Promise<void>;
}

export function useFechamento(): UseFechamentoResult {
  const [preview, setPreview] = useState<Fechamento | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [confirmando, setConfirmando] = useState(false);
  const [erroConfirmar, setErroConfirmar] = useState<string | null>(null);
  const [fechamentoConfirmado, setFechamentoConfirmado] = useState<Fechamento | null>(null);

  const carregarPreview = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      setPreview(await obterPreviewFechamento());
    } catch (err) {
      setErro(mensagemDeErro(err, "Não foi possível calcular o fechamento do dia."));
      setPreview(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    carregarPreview();
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [carregarPreview]);

  const confirmar = useCallback(async (valorFisicoInformado: number) => {
    setConfirmando(true);
    setErroConfirmar(null);
    try {
      setFechamentoConfirmado(await confirmarFechamento(valorFisicoInformado));
    } catch (err) {
      setErroConfirmar(mensagemDeErro(err, "Não foi possível confirmar o fechamento."));
      throw err;
    } finally {
      setConfirmando(false);
    }
  }, []);

  return { preview, loading, erro, confirmando, erroConfirmar, fechamentoConfirmado, confirmar };
}