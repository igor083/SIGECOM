"use client";

import { useMetaVendaDiaria } from "@/hooks/useMetaVendaDiaria";
import styles from "./MetaVendaDiaria.module.css";

function formatarPreco(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function MetaVendaDiaria() {
  const { dados, carregando, erro } = useMetaVendaDiaria();

  if (carregando) {
    return <div className={styles.card}><span className={styles.skeleton} /></div>;
  }

  if (erro || !dados) {
    return (
      <div className={styles.card}>
        <span className={styles.erroTexto}>{erro ?? "Sem dados."}</span>
      </div>
    );
  }

  const noBazul = dados.noBazul;
  const barraLargura = Math.min(dados.percentual, 100);

  return (
    <div className={styles.card}>
      <div className={styles.topo}>
        <span className={styles.titulo}>Meta do dia</span>
        <span className={noBazul ? styles.badgeAzul : styles.badgeAbaixo}>
          {noBazul ? "No azul" : "Abaixo da meta"}
        </span>
      </div>

      <div className={styles.valores}>
        <div className={styles.valorBloco}>
          <span className={styles.valorLabel}>Realizado hoje</span>
          <span className={styles.valorPrincipal}>{formatarPreco(dados.realizadoHoje)}</span>
        </div>
        <div className={styles.separador} />
        <div className={styles.valorBloco}>
          <span className={styles.valorLabel}>Meta</span>
          <span className={styles.valorSecundario}>{formatarPreco(dados.metaDia)}</span>
        </div>
        <div className={styles.separador} />
        <div className={styles.valorBloco}>
          <span className={styles.valorLabel}>Atingido</span>
          <span className={noBazul ? styles.percentualAzul : styles.percentualAbaixo}>
            {dados.percentual.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Barra de progresso */}
      <div className={styles.barraFundo}>
        <div
          className={noBazul ? styles.barraAzul : styles.barraAbaixo}
          style={{ width: `${barraLargura}%` }}
        />
      </div>
    </div>
  );
}
