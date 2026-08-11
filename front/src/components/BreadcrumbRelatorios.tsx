"use client";

import Link from "next/link";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import styles from "./BreadcrumbRelatorios.module.css";

export interface ItemTrilha {
  label: string;
  href?: string;
}

interface Props {
  trilha: ItemTrilha[];
}

export default function BreadcrumbRelatorios({ trilha }: Props) {
  const backHref = [...trilha].reverse().find((item) => item.href)?.href;

  return (
    <nav className={styles.trilha} aria-label="Navegação">
      {backHref && (
        <Link href={backHref} className={styles.backBtn} aria-label="Voltar">
          <ArrowBackIcon sx={{ fontSize: 16 }} />
        </Link>
      )}
      {trilha.map((item, i) => {
        const ultimo = i === trilha.length - 1;
        return (
          <span key={`${item.label}-${i}`} className={styles.item}>
            {item.href && !ultimo ? (
              <Link href={item.href} className={styles.link}>
                {item.label}
              </Link>
            ) : (
              <span className={styles.atual} aria-current={ultimo ? "page" : undefined}>
                {item.label}
              </span>
            )}
            {!ultimo && (
              <ChevronRightIcon className={styles.sep} sx={{ fontSize: 16 }} />
            )}
          </span>
        );
      })}
    </nav>
  );
}
