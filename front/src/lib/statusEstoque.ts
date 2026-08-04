import type { StatusEstoque } from "@/services/relatoriosEstoque";

export interface StatusMeta {
  rotulo: string;
  cor: string;
  fundo: string;
}

export const STATUS_META: Record<StatusEstoque, StatusMeta> = {
  NORMAL: {
    rotulo: "Normal",
    cor: "var(--color-success)",
    fundo: "color-mix(in srgb, var(--color-success) 12%, transparent)",
  },
  ALERTA: {
    rotulo: "Alerta",
    cor: "var(--color-warning)",
    fundo: "color-mix(in srgb, var(--color-warning) 16%, transparent)",
  },
  CRITICO: {
    rotulo: "Crítico",
    cor: "var(--color-error)",
    fundo: "color-mix(in srgb, var(--color-error) 12%, transparent)",
  },
};
