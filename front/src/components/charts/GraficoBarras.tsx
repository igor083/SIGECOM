"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_CURSOR, ESTILO_TOOLTIP, useChartTokens } from "./chartTheme";

export interface PontoBarra {
  rotulo: string;
  valor: number;
  [extra: string]: unknown;
}

interface GraficoBarrasProps {
  dados: PontoBarra[];
  formatarValor?: (valor: number) => string;
  formatarEixoY?: (valor: number) => string;
  formatarTooltip?: (ponto: PontoBarra) => string;
  rotuloTooltip?: (rotulo: string) => string;
  nomeSerie?: string;
  cor?: string;
  altura?: number;
}

export default function GraficoBarras({
  dados,
  formatarValor = String,
  formatarEixoY,
  formatarTooltip,
  rotuloTooltip,
  nomeSerie = "",
  cor,
  altura = 280,
}: GraficoBarrasProps) {
  const t = useChartTokens();

  return (
    <ResponsiveContainer width="100%" height={altura}>
      <BarChart data={dados} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={t.grade} />
        <XAxis
          dataKey="rotulo"
          tick={{ fontSize: 12, fill: t.texto }}
          tickLine={false}
          axisLine={{ stroke: t.eixo }}
        />
        <YAxis
          width={64}
          tick={{ fontSize: 12, fill: t.texto }}
          tickLine={false}
          axisLine={false}
          tickFormatter={formatarEixoY ?? formatarValor}
        />
        <Tooltip
          cursor={{ fill: CHART_CURSOR }}
          formatter={(valor, _n, item) => [
            formatarTooltip
              ? formatarTooltip(item?.payload as PontoBarra)
              : formatarValor(Number(valor)),
            nomeSerie,
          ]}
          labelFormatter={(l) => (rotuloTooltip ? rotuloTooltip(String(l)) : String(l))}
          contentStyle={ESTILO_TOOLTIP}
        />
        <Bar dataKey="valor" fill={cor ?? t.primaria} radius={[4, 4, 0, 0]} maxBarSize={48} />
      </BarChart>
    </ResponsiveContainer>
  );
}
