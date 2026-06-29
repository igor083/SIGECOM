"use client";

import styles from "./EmConstrucao.module.css";

interface EmConstrucaoProps {
  titulo: string;
  descricao?: string;
}

export default function EmConstrucao({ titulo, descricao }: EmConstrucaoProps) {
  return (
    <div className={styles.container}>
      <div className={styles.icon}>🚧</div>
      <h2 className={styles.titulo}>{titulo}</h2>
      <p className={styles.descricao}>
        {descricao ?? "Este módulo ainda está em desenvolvimento e será disponibilizado em breve."}
      </p>
    </div>
  );
}
