"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getDashboardDesempenho,
  type DashboardDesempenhoResponse,
  type PeriodoRelatorio,
} from "@/services/dashboard";

export interface UseDashboardDesempenhoResult {
  dados: DashboardDesempenhoResponse | null;
  carregando: boolean;
  erro: string | null;
  periodo: PeriodoRelatorio;
  setPeriodo: (p: PeriodoRelatorio) => void;
}

export function useDashboardDesempenho(
  inicial: PeriodoRelatorio = "SEMANA"
): UseDashboardDesempenhoResult {
  const [dados, setDados] = useState<DashboardDesempenhoResponse | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [periodo, setPeriodo] = useState<PeriodoRelatorio>(inicial);

  const buscar = useCallback(async (p: PeriodoRelatorio) => {
    setCarregando(true);
    setErro(null);
    try {
      const res = await getDashboardDesempenho(p);
      setDados(res);
    } catch {
      setErro("Não foi possível carregar o dashboard.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    buscar(periodo);
  }, [periodo, buscar]);

  return { dados, carregando, erro, periodo, setPeriodo };
}
