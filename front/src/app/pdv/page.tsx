"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import AppShell from "@/components/AppShell";
import PointOfSaleOutlinedIcon from "@mui/icons-material/PointOfSaleOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import styles from "./pdv.module.css";

export default function PdvHubPage() {
  const router = useRouter();
  const { loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace("/login");
  }, [loading, isAuthenticated, router]);

  if (loading || !isAuthenticated) return null;

  return (
    <AppShell title="PDV — Ponto de Venda">
      <div className={styles.header}>
        <h2 className={styles.titulo}>O que você quer fazer?</h2>
        <p className={styles.subtitulo}>
          Escolha entre iniciar uma nova venda ou consultar o histórico.
        </p>
      </div>

      <div className={styles.cards}>
        <Link href="/pdv/nova" className={`${styles.card} ${styles.cardPrimary}`}>
          <div className={styles.iconeWrapper}>
            <PointOfSaleOutlinedIcon sx={{ fontSize: 32 }} />
          </div>
          <div className={styles.textos}>
            <span className={styles.cardTitulo}>Iniciar nova venda</span>
            <span className={styles.cardDescricao}>
              Buscar produtos, montar o carrinho e registrar a venda.
            </span>
          </div>
          <span className={styles.seta} aria-hidden>
            →
          </span>
        </Link>

        <Link href="/pdv/historico" className={styles.card}>
          <div className={styles.iconeWrapper}>
            <ReceiptLongOutlinedIcon sx={{ fontSize: 32 }} />
          </div>
          <div className={styles.textos}>
            <span className={styles.cardTitulo}>Ver histórico</span>
            <span className={styles.cardDescricao}>
              Consultar vendas registradas com filtros e paginação.
            </span>
          </div>
          <span className={styles.seta} aria-hidden>
            →
          </span>
        </Link>
      </div>
    </AppShell>
  );
}
