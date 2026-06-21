// =============================================================
// app/page.tsx — Homepage Dinâmica (SIGECOM)
// =============================================================
// Redireciona ou exibe opções de acordo com o estado de login
// do usuário. Se logado como ADMIN, exibe atalho para Gestão
// de Produtos e Estoque (Sprint 2) e Cadastro de Acessos.
// Se deslogado, convida a realizar o Login.
// =============================================================

"use client";

import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  const { user, isAuthenticated, loading, logout } = useAuth();

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

        {loading ? (
          <div className={styles.card}>
            <p className={styles.description}>Verificando sessão ativa...</p>
          </div>
        ) : isAuthenticated && user ? (
          <div className={styles.card} style={{ maxWidth: "550px" }}>
            <div className={styles.statusBadge}>
              <span className={styles.statusDot} />
              Sessão Ativa
            </div>
            
            <p className={styles.description} style={{ marginBottom: "1.5rem" }}>
              Olá, <strong>{user.email}</strong>!<br />
              Você está conectado como{" "}
              <strong>
                {user.perfil === "ADMIN" ? "Administrador" : "Funcionário"}
              </strong>.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {user.perfil === "ADMIN" && (
                <>
                  <Link
                    href="/produtos"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem",
                      padding: "0.75rem 1.5rem",
                      backgroundColor: "var(--color-primary)",
                      color: "#fff",
                      borderRadius: "var(--radius-md)",
                      fontWeight: 600,
                      textDecoration: "none",
                      transition: "background-color var(--transition-fast)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = "var(--color-primary-dark)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = "var(--color-primary)";
                    }}
                  >
                    📦 Gerenciar Produtos e Estoque
                  </Link>

                  <Link
                    href="/cadastro"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem",
                      padding: "0.75rem 1.5rem",
                      backgroundColor: "var(--color-bg-elevated)",
                      color: "var(--color-text)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-md)",
                      fontWeight: 600,
                      textDecoration: "none",
                      transition: "all var(--transition-fast)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border-hover)";
                      (e.currentTarget as HTMLElement).style.backgroundColor = "var(--color-bg)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border)";
                      (e.currentTarget as HTMLElement).style.backgroundColor = "var(--color-bg-elevated)";
                    }}
                  >
                    👤 Cadastrar Novo Usuário
                  </Link>
                </>
              )}

              {user.perfil === "FUNCIONARIO" && (
                <div
                  style={{
                    padding: "0.75rem",
                    backgroundColor: "var(--color-bg)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-md)",
                    fontSize: "0.9rem",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  ⚠️ Módulos do Funcionário (vendas, caixa) serão liberados na próxima Sprint.
                </div>
              )}

              <button
                onClick={logout}
                style={{
                  marginTop: "0.5rem",
                  padding: "0.6rem 1.5rem",
                  backgroundColor: "transparent",
                  color: "var(--color-error)",
                  border: "1px solid var(--color-error)",
                  borderRadius: "var(--radius-md)",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all var(--transition-fast)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "rgb(220 38 38 / 0.08)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                }}
              >
                Sair da Conta
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.card}>
            <p className={styles.description} style={{ marginBottom: "1.25rem" }}>
              Seja bem-vindo ao SIGECOM. Para acessar as ferramentas de gestão comercial e estoque, faça o login.
            </p>
            <Link
              href="/login"
              style={{
                display: "inline-block",
                padding: "0.75rem 2rem",
                backgroundColor: "var(--color-primary)",
                color: "#fff",
                borderRadius: "var(--radius-md)",
                fontWeight: 600,
                textDecoration: "none",
                transition: "background-color var(--transition-fast)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "var(--color-primary-dark)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "var(--color-primary)";
              }}
            >
              Entrar no Sistema
            </Link>
          </div>
        )}

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
            <div className={styles.featureIcon}>📦</div>
            <span>Gestão de Estoque</span>
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>SIGECOM &copy; 2026 — Projeto acadêmico UEPB</p>
      </footer>
    </div>
  );
}
