// =============================================================
// app/trocar-senha/page.tsx — Troca de senha do próprio usuário
// =============================================================
// Contrapartida do PwdResetRequiredFilter da API: quando um admin
// redefine a senha de alguém, o token daquele usuário passa a
// carregar `pwd_reset_required` e a API responde 403 em tudo,
// menos GET /auth/me e PATCH /auth/me/senha.
//
// Sem esta tela o usuário logava e batia em "Você não tem permissão
// para acessar este recurso" em todas as telas, sem nenhum caminho
// de saída pela interface.
// =============================================================

"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { trocarMinhaSenha } from "@/services/auth";
import { mensagemDeErro } from "@/lib/apiError";
import styles from "@/components/forms.module.css";

const SENHA_MIN = 6;

export default function TrocarSenhaPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading, aplicarToken } = useAuth();

  const [senhaAtual, setSenhaAtual] = useState("");
  const [senhaNova, setSenhaNova] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const obrigatoria = user?.senhaTemporaria === true;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);

    if (senhaNova.length < SENHA_MIN) {
      setErro(`A nova senha deve ter ao menos ${SENHA_MIN} caracteres.`);
      return;
    }
    if (senhaNova !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }
    if (senhaNova === senhaAtual) {
      setErro("A nova senha precisa ser diferente da atual.");
      return;
    }

    setEnviando(true);
    try {
      const resposta = await trocarMinhaSenha({ senhaAtual, senhaNova });

      // Trocar o token guardado é parte da operação, não um detalhe: o
      // bloqueio vive dentro do token, então o antigo continua levando 403
      // mesmo com a senha já trocada no banco.
      aplicarToken(resposta.token);

      router.replace("/");
    } catch (err) {
      setErro(mensagemDeErro(err, "Não foi possível trocar a senha."));
      setEnviando(false);
    }
  }

  if (authLoading || !isAuthenticated) {
    return null;
  }

  return (
    <main className={styles.wrapper}>
      <div className={styles.card}>
        <h1 className={styles.title}>
          {obrigatoria ? "Defina uma nova senha" : "Trocar senha"}
        </h1>
        <p className={styles.subtitle}>
          {obrigatoria
            ? "Sua senha foi definida por um administrador. Escolha uma senha própria para continuar."
            : "Escolha uma nova senha para a sua conta"}
        </p>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {erro && (
            <div className={`${styles.alert} ${styles.alertError}`} role="alert">
              {erro}
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label} htmlFor="senhaAtual">
              Senha atual
            </label>
            <input
              id="senhaAtual"
              className={styles.input}
              type="password"
              autoComplete="current-password"
              autoFocus
              placeholder={obrigatoria ? "A senha que o administrador definiu" : "Sua senha atual"}
              value={senhaAtual}
              onChange={(e) => setSenhaAtual(e.target.value)}
              disabled={enviando}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="senhaNova">
              Nova senha
            </label>
            <input
              id="senhaNova"
              className={styles.input}
              type="password"
              autoComplete="new-password"
              placeholder={`Mínimo ${SENHA_MIN} caracteres`}
              value={senhaNova}
              onChange={(e) => setSenhaNova(e.target.value)}
              disabled={enviando}
              required
            />
            <span className={styles.hint}>Use ao menos {SENHA_MIN} caracteres.</span>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="confirmarSenha">
              Confirmar nova senha
            </label>
            <input
              id="confirmarSenha"
              className={styles.input}
              type="password"
              autoComplete="new-password"
              placeholder="Repita a nova senha"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              disabled={enviando}
              required
            />
          </div>

          <button
            className={styles.button}
            type="submit"
            disabled={enviando || !senhaAtual || !senhaNova || !confirmarSenha}
          >
            {enviando ? "Salvando..." : "Salvar nova senha"}
          </button>
        </form>
      </div>
    </main>
  );
}
