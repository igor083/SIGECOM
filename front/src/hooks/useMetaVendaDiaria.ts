"use client";

import { useState, useEffect } from "react";
import { getMetaVendaDiaria, type MetaVendaDiariaResponse } from "@/services/dashboard";

export interface UseMetaVendaDiariaResult {
  dados: MetaVendaDiariaResponse | null;
  carregando: boolean;
  erro: string | null;
}

export function useMetaVendaDiaria(): UseMetaVendaDiariaResult {
  const [dados, setDados] = useState<MetaVendaDiariaResponse | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    async function buscar() {
      try {
        const res = await getMetaVendaDiaria();
        if (!cancelado) setDados(res);
      } catch {
        if (!cancelado) setErro("Não foi possível carregar a meta do dia.");
      } finally {
        if (!cancelado) setCarregando(false);
      }
    }

    buscar();
    return () => { cancelado = true; };
  }, []);

  return { dados, carregando, erro };
}
