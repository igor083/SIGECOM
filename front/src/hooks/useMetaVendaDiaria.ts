"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getMetaVendaDiaria, type MetaVendaDiariaResponse } from "@/services/dashboard";

export interface UseMetaVendaDiariaResult {
  dados: MetaVendaDiariaResponse | null;
  carregando: boolean;
  erro: string | null;
  recarregar: () => Promise<void>;
}

export function useMetaVendaDiaria(): UseMetaVendaDiariaResult {
  const [dados, setDados] = useState<MetaVendaDiariaResponse | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const montado = useRef(true);

  const buscar = useCallback(async () => {
    setCarregando(true);
    try {
      const res = await getMetaVendaDiaria();
      if (montado.current) {
        setDados(res);
        setErro(null);
      }
    } catch {
      if (montado.current) setErro("Não foi possível carregar a meta do dia.");
    } finally {
      if (montado.current) setCarregando(false);
    }
  }, []);

  useEffect(() => {
    montado.current = true;
    buscar();
    return () => {
      montado.current = false;
    };
  }, [buscar]);

  return { dados, carregando, erro, recarregar: buscar };
}
