// =============================================================
// services/parametrosFinanceiros.ts — Persistência dos Parâmetros (localStorage)
// =============================================================
// MVP: persistência em localStorage para independência do front (D-5).
// =============================================================

import { ParametrosFinanceiros } from "@/lib/markup";

const LOCAL_STORAGE_KEY = "sigecom_parametros_financeiros";

export const PARAMETROS_DEFAULT: ParametrosFinanceiros = {
  custosFixosPercent: 15,
  impostosPercent: 12,
  taxaMaquininhaPercent: 4,
  comissaoPercent: 5,
  lucroDesejadoPercent: 20,
  diasUteis: 22,
};

/**
 * Retorna os parâmetros salvos no localStorage ou os valores padrão.
 */
export function obterParametrosFinanceiros(): ParametrosFinanceiros {
  if (typeof window === "undefined") {
    return PARAMETROS_DEFAULT;
  }
  
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Erro ao parsear parâmetros financeiros do localStorage:", e);
    }
  }
  
  // Semeia no localStorage pela primeira vez se não existir
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(PARAMETROS_DEFAULT));
  return PARAMETROS_DEFAULT;
}

/**
 * Salva as alterações de parâmetros financeiros da loja no localStorage.
 */
export function salvarParametrosFinanceiros(params: ParametrosFinanceiros): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(params));
  }
}
