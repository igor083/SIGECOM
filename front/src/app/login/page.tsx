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
        <h1 className={styles.title} style={{ color: '#2d3a8c', fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>SIGECOM</h1>
        <p className={styles.subtitle}>Bem-vindo</p>

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

      
      </div>
    </div>
  );
}
