// =============================================================
// app/login/page.tsx — Autenticação (entrada do sistema)
// =============================================================
// Usa forms.module.css, o mesmo da tela de cadastro: as duas telas
// de autenticação precisam ser reconhecidamente a mesma coisa, e o
// módulo já existia para isso (driver D-5 — Manutenibilidade).
// =============================================================

"use client";

import { useState, useEffect, type FormEvent, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { mensagemDeErro } from "@/lib/apiError";
import styles from "@/components/forms.module.css";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, loading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Quem chega aqui já autenticado volta para a raiz. O useAuth não faz isso
  // sozinho — ele só redireciona no logout.
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
      const resposta = await login(email.trim(), senha);

      // Senha definida por administrador: a API vai responder 403 em todas as
      // outras rotas até a troca acontecer, então mandar para a raiz aqui
      // levaria direto a uma tela de "sem permissão".
      router.replace(resposta.senhaTemporaria ? "/trocar-senha" : "/");
    } catch (err) {
      setErro(mensagemDeErro(err, "E-mail ou senha incorretos."));
      setEnviando(false);
    }
  }

  // Detecta Caps Lock no campo de senha, onde o texto mascarado esconde o
  // problema. Só o evento de teclado sabe disso — não há como derivar do valor.
  function verificarCapsLock(e: KeyboardEvent<HTMLInputElement>) {
    setCapsLock(e.getModifierState?.("CapsLock") ?? false);
  }

  // Esconde o formulário assim que se sabe que há sessão, para quem recarrega
  // já logado não ficar olhando a tela de login até o replace acima concluir.
  //
  // A condição é só `isAuthenticated`, e não `authLoading || isAuthenticated`
  // como na tela de cadastro: lá o padrão é negar até provar que pode entrar,
  // aqui o padrão é mostrar o formulário. Bloquear durante o loading deixaria
  // a página sair vazia do servidor e só ganhar conteúdo após a hidratação —
  // um branco no caso comum, que é o visitante sem sessão nenhuma.
  if (isAuthenticated) {
    return null;
  }

  return (
    <main className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <svg
            className={styles.brandIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M3 9l1.5-5h15L21 9" />
            <path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z" />
            <path d="M5 13v7h14v-7" />
            <path d="M10 20v-4h4v4" />
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
              autoFocus
              placeholder="usuario@empresa.com"
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
            <div className={styles.inputWrapper}>
              <input
                id="senha"
                className={`${styles.input} ${styles.inputWithAction}`}
                type={mostrarSenha ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Sua senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                onKeyUp={verificarCapsLock}
                onKeyDown={verificarCapsLock}
                onBlur={() => setCapsLock(false)}
                disabled={enviando}
                required
              />
              <button
                type="button"
                className={styles.inputAction}
                onClick={() => setMostrarSenha((v) => !v)}
                disabled={enviando}
                aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                aria-pressed={mostrarSenha}
                title={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
              >
                {mostrarSenha ? (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {capsLock && (
              <span className={styles.capsHint} role="status">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 2 2 12h5v6h10v-6h5L12 2z" />
                </svg>
                Caps Lock está ligado
              </span>
            )}
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
    </main>
  );
}
