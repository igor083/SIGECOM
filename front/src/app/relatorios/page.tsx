"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import AppShell from "@/components/AppShell";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import styles from "./relatorios.module.css";

export default function RelatoriosHubPage() {
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.perfil !== "ADMIN")) {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, user, router]);

  if (loading || !isAuthenticated) return null;

  return (
    <AppShell title="Relatórios">
      <div className={styles.header}>
        <h2 className={styles.titulo}>O que você quer analisar?</h2>
        <p className={styles.subtitulo}>
          Escolha um relatório gerencial para acompanhar o desempenho do negócio.
        </p>
      </div>

      <div className={styles.cards}>
        <Link href="/relatorios/vendas" className={`${styles.card} ${styles.cardPrimary}`}>
          <div className={styles.iconeWrapper}>
            <AssessmentOutlinedIcon sx={{ fontSize: 32 }} />
          </div>
          <div className={styles.textos}>
            <span className={styles.cardTitulo}>Relatório de vendas</span>
            <span className={styles.cardDescricao}>
              Total, ticket médio, gráficos por período/forma de pagamento e exportação em planilha.
            </span>
          </div>
          <span className={styles.seta} aria-hidden>
            →
          </span>
        </Link>

        <Link href="/relatorios/estoque" className={styles.card}>
          <div className={styles.iconeWrapper}>
            <Inventory2OutlinedIcon sx={{ fontSize: 32 }} />
          </div>
          <div className={styles.textos}>
            <span className={styles.cardTitulo}>Relatório de estoque</span>
            <span className={styles.cardDescricao}>
              Níveis de estoque, produtos em alerta/crítico, valor em estoque e giro por produto.
            </span>
          </div>
          <span className={styles.seta} aria-hidden>
            →
          </span>
        </Link>

        <Link href="/relatorios/financeiro" className={styles.card}>
          <div className={styles.iconeWrapper}>
            <AccountBalanceWalletOutlinedIcon sx={{ fontSize: 32 }} />
          </div>
          <div className={styles.textos}>
            <span className={styles.cardTitulo}>Relatório financeiro</span>
            <span className={styles.cardDescricao}>
              Receitas, despesas e saldo do período, com quebra por categoria financeira.
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
