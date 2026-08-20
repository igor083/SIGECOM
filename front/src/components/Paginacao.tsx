// =============================================================
// components/Paginacao.tsx — Paginação com janela deslizante
// =============================================================
// As telas de listagem desenhavam um botão por página com
// `Array.from({ length: totalPages })`. Com 135 páginas isso
// virava 135 botões numa linha só: impossível de usar e um custo
// de render que cresce junto com o banco.
//
// Aqui a barra tem tamanho fixo — no máximo 7 números, sempre
// com a primeira e a última visíveis e reticências nos trechos
// pulados. Não importa se são 8 páginas ou 8 mil.
// =============================================================

"use client";

import styles from "./Paginacao.module.css";

/** Quantas páginas aparecem de cada lado da atual. */
const RAIO = 1;

/**
 * Números que a barra mostra, em base 1. `null` é um trecho pulado.
 *
 * Sempre devolve a mesma quantidade de itens quando há reticências, para os
 * botões não dançarem de posição enquanto o usuário navega.
 */
export function paginasVisiveis(atual: number, total: number): (number | null)[] {
  // Cabe tudo sem reticência: 1 + (2*RAIO+1) + 1 + as duas reticências.
  const limite = 2 * RAIO + 5;
  if (total <= limite) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const paginas: (number | null)[] = [1];

  // A janela encosta nas pontas para não encolher perto do início/fim:
  // na página 1 mostra 1..(2*RAIO+3), na última mostra as finais.
  let inicio = Math.max(2, atual - RAIO);
  let fim = Math.min(total - 1, atual + RAIO);

  if (atual - RAIO <= 2) {
    fim = 2 * RAIO + 3;
  }
  if (atual + RAIO >= total - 1) {
    inicio = total - (2 * RAIO + 2);
  }

  if (inicio > 2) {
    paginas.push(null);
  }
  for (let p = inicio; p <= fim; p++) {
    paginas.push(p);
  }
  if (fim < total - 1) {
    paginas.push(null);
  }

  paginas.push(total);
  return paginas;
}

interface PaginacaoProps {
  /** Página atual, base 0 (é o que a API do Spring devolve e espera). */
  page: number;
  totalPages: number;
  totalElements: number;
  /** Nome do que está sendo listado, para o resumo: "135 usuários". */
  rotulo: string;
  onPageChange: (page: number) => void;
}

export default function Paginacao({
  page,
  totalPages,
  totalElements,
  rotulo,
  onPageChange,
}: PaginacaoProps) {
  const atual = page + 1;

  return (
    <div className={styles.pagination}>
      <span className={styles.pageInfo}>
        Página <strong>{atual}</strong> de <strong>{totalPages}</strong> ({totalElements} {rotulo})
      </span>

      <nav className={styles.pageBtns} aria-label="Paginação">
        <button
          type="button"
          className={styles.pageBtn}
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
        >
          Anterior
        </button>

        {paginasVisiveis(atual, totalPages).map((p, i) =>
          p === null ? (
            // key pelo índice porque reticências não têm identidade própria;
            // a lista é recriada a cada render e nunca é reordenada.
            <span key={`gap-${i}`} className={styles.reticencias} aria-hidden="true">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              className={`${styles.pageBtn} ${p === atual ? styles.pageBtnActive : ""}`}
              aria-current={p === atual ? "page" : undefined}
              aria-label={`Página ${p}`}
              onClick={() => onPageChange(p - 1)}
            >
              {p}
            </button>
          )
        )}

        <button
          type="button"
          className={styles.pageBtn}
          disabled={page >= totalPages - 1}
          onClick={() => onPageChange(page + 1)}
        >
          Próxima
        </button>
      </nav>
    </div>
  );
}
