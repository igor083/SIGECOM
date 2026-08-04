"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { ESTILO_TOOLTIP, useChartTokens } from "./chartTheme";

export interface FatiaRosca {
  rotulo: string;
  valor: number;
  cor: string;
  [extra: string]: unknown;
}

interface GraficoRoscaProps {
  dados: FatiaRosca[];
  formatarTooltip?: (fatia: FatiaRosca, percentual: number) => string;
  legenda?: boolean;
  altura?: number;
}

export default function GraficoRosca({
  dados,
  formatarTooltip,
  legenda = true,
  altura = 280,
}: GraficoRoscaProps) {
  const t = useChartTokens();
  const total = dados.reduce((s, f) => s + f.valor, 0);

  return (
    <ResponsiveContainer width="100%" height={altura}>
      <PieChart>
        <Pie
          data={dados}
          dataKey="valor"
          nameKey="rotulo"
          cx="50%"
          cy="50%"
          innerRadius={58}
          outerRadius={92}
          paddingAngle={2}
          stroke={t.card}
          strokeWidth={2}
        >
          {dados.map((f) => (
            <Cell key={f.rotulo} fill={f.cor} />
          ))}
        </Pie>
        {legenda && (
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(valor) => (
              <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{valor}</span>
            )}
          />
        )}
        <Tooltip
          formatter={(valor, _n, item) => {
            const fatia = item?.payload as FatiaRosca;
            const pct = total > 0 ? (Number(valor) / total) * 100 : 0;
            return [
              formatarTooltip ? formatarTooltip(fatia, pct) : String(valor),
              fatia?.rotulo ?? "",
            ];
          }}
          contentStyle={ESTILO_TOOLTIP}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
