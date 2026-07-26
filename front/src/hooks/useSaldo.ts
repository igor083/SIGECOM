// D-5: quem fala com a API de saldo e este hook, o PainelSaldo so exibe

import { useState, useEffect, useCallback } from "react";
import { obterSaldo, type Saldo } from "@/services/lancamentos";
import { mensagemDeErro } from "@/lib/apiError";

export type PeriodoSaldo = "dia" | "semana" | "mes";

export interface UseSaldoResult {
  saldo: Saldo | null;
  periodo: PeriodoSaldo;
  setPeriodo: (p: PeriodoSaldo) => void;
  loading: boolean;
  erro: string | null;
  recarregar: () => Promise<void>;
}

function iso(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// dia = hoje, semana = domingo ate hoje, mes = dia 1 ate hoje
function intervalo(periodo: PeriodoSaldo): { inicio: string; fim: string } {
  const hoje = new Date();
  const fim = iso(hoje);

  if (periodo === "dia") return { inicio: fim, fim };

  if (periodo === "semana") {
    const domingo = new Date(hoje);
    domingo.setDate(hoje.getDate() - hoje.getDay());
    return { inicio: iso(domingo), fim };
  }

  const primeiro = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  return { inicio: iso(primeiro), fim };
}

export function useSaldo(periodoInicial: PeriodoSaldo = "mes"): UseSaldoResult {
  const [saldo, setSaldo] = useState<Saldo | null>(null);
  const [periodo, setPeriodo] = useState<PeriodoSaldo>(periodoInicial);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const { inicio, fim } = intervalo(periodo);
      setSaldo(await obterSaldo(inicio, fim));
    } catch (err) {
      setErro(mensagemDeErro(err, "Não foi possível carregar o saldo."));
      setSaldo(null);
    } finally {
      setLoading(false);
    }
  }, [periodo]);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    carregar();
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [carregar]);

  return { saldo, periodo, setPeriodo, loading, erro, recarregar: carregar };
}
