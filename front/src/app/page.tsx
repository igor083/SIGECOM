import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        {/* Ícone decorativo */}
        <div className={styles.iconWrapper}>
          <svg
            className={styles.icon}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>

        <h1 className={styles.title}>SIGECOM</h1>
        <p className={styles.subtitle}>
          Sistema Inteligente de Gestão Comercial
        </p>

        <div className={styles.card}>
          <div className={styles.statusBadge}>
            <span className={styles.statusDot} />
            Estrutura base pronta
          </div>
          <p className={styles.description}>
            O front-end está configurado e funcionando. As telas de login,
            cadastro e dashboard serão implementadas nas próximas sprints.
          </p>
        </div>

        <div className={styles.features}>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>🔐</div>
            <span>Autenticação JWT</span>
          </div>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>🛡️</div>
            <span>Controle por perfil</span>
          </div>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>⚡</div>
            <span>Next.js + TypeScript</span>
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>SIGECOM &copy; 2026 — Projeto acadêmico UEPB</p>
      </footer>
    </div>
  );
}
