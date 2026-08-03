"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import AppShell from "@/components/AppShell";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
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

        <div className={`${styles.card} ${styles.cardDisabled}`} aria-disabled>
          <div className={styles.iconeWrapper}>
            <InsightsOutlinedIcon sx={{ fontSize: 32 }} />
          </div>
          <div className={styles.textos}>
            <span className={styles.cardTitulo}>Mais relatórios</span>
            <span className={styles.cardDescricao}>Em breve.</span>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
