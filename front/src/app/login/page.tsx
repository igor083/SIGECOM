// =============================================================
// app/login/page.tsx — Tela de Login (US-004 / SCRUM-7)
// =============================================================
// Formulário e-mail + senha que autentica via useAuth().login.
// - Persiste o token (tratado no hook/serviço).
// - Trata erros da API com mensagem amigável.
// - Se já autenticado, redireciona para a home.
// =============================================================

"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { mensagemDeErro } from "@/lib/apiError";
import styles from "@/components/forms.module.css";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, loading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Já logado? Não faz sentido ficar no login.
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace("/");
    }
  }, [authLoading, isAuthenticated, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);

    try {
      await login(email.trim(), senha);
      router.replace("/");
    } catch (err) {
      setErro(mensagemDeErro(err, "Não foi possível entrar. Tente novamente."));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <svg
            className={styles.brandIcon}
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
          <span className={styles.brandName}>SIGECOM</span>
        </div>

        <h1 className={styles.title}>Entrar</h1>
        <p className={styles.subtitle}>Acesse sua conta para continuar</p>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {erro && (
            <div className={`${styles.alert} ${styles.alertError}`} role="alert">
              {erro}
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">
              E-mail
            </label>
            <input
              id="email"
              className={styles.input}
              type="email"
              autoComplete="email"
              placeholder="voce@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={enviando}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="senha">
              Senha
            </label>
            <input
              id="senha"
              className={styles.input}
              type="password"
              autoComplete="current-password"
              placeholder="Sua senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              disabled={enviando}
              required
            />
          </div>

          <button
            className={styles.button}
            type="submit"
            disabled={enviando || !email || !senha}
          >
            {enviando ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className={styles.footer}>
          <Link href="/">Voltar para o início</Link>
        </p>
      </div>
    </div>
  );
}
