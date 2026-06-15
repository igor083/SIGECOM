// =============================================================
// app/cadastro/page.tsx — Cadastro de Usuários (US-005 / SCRUM-8)
// =============================================================
// Tela restrita a ADMIN (o endpoint POST /auth/cadastro exige
// token de administrador). Aplica o driver D-2 (Segurança):
// quem não for ADMIN é redirecionado para /login.
// Cria usuários ADMIN ou FUNCIONARIO via services/auth.cadastro.
// =============================================================

"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { cadastro, type TipoUsuario } from "@/services/auth";
import { mensagemDeErro } from "@/lib/apiError";
import styles from "@/components/forms.module.css";

const SENHA_MIN = 6;

export default function CadastroPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [perfil, setPerfil] = useState<TipoUsuario>("FUNCIONARIO");

  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Guarda de rota (D-2): só ADMIN autenticado acessa.
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || user?.perfil !== "ADMIN") {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, user, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setSucesso(null);

    // Validações de cliente antes de chamar a API.
    if (senha.length < SENHA_MIN) {
      setErro(`A senha deve ter ao menos ${SENHA_MIN} caracteres.`);
      return;
    }
    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }

    setEnviando(true);
    try {
      const criado = await cadastro({
        nome: nome.trim(),
        email: email.trim(),
        senha,
        perfil,
      });

      setSucesso(`Usuário "${criado.nome}" cadastrado com sucesso.`);
      // Limpa o formulário para um próximo cadastro.
      setNome("");
      setEmail("");
      setSenha("");
      setConfirmarSenha("");
      setPerfil("FUNCIONARIO");
    } catch (err) {
      setErro(mensagemDeErro(err, "Não foi possível cadastrar o usuário."));
    } finally {
      setEnviando(false);
    }
  }

  // Enquanto verifica auth / redireciona, não renderiza o formulário.
  if (authLoading || !isAuthenticated || user?.perfil !== "ADMIN") {
    return null;
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <h1 className={styles.title}>Cadastrar usuário</h1>
        <p className={styles.subtitle}>
          Crie acessos de administrador ou funcionário
        </p>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {erro && (
            <div className={`${styles.alert} ${styles.alertError}`} role="alert">
              {erro}
            </div>
          )}
          {sucesso && (
            <div
              className={`${styles.alert} ${styles.alertSuccess}`}
              role="status"
            >
              {sucesso}
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label} htmlFor="nome">
              Nome
            </label>
            <input
              id="nome"
              className={styles.input}
              type="text"
              autoComplete="name"
              placeholder="Nome completo"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              disabled={enviando}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">
              E-mail
            </label>
            <input
              id="email"
              className={styles.input}
              type="email"
              autoComplete="off"
              placeholder="usuario@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={enviando}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="perfil">
              Perfil
            </label>
            <select
              id="perfil"
              className={styles.select}
              value={perfil}
              onChange={(e) => setPerfil(e.target.value as TipoUsuario)}
              disabled={enviando}
            >
              <option value="FUNCIONARIO">Funcionário</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="senha">
              Senha
            </label>
            <input
              id="senha"
              className={styles.input}
              type="password"
              autoComplete="new-password"
              placeholder={`Mínimo ${SENHA_MIN} caracteres`}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              disabled={enviando}
              required
            />
            <span className={styles.hint}>
              Use ao menos {SENHA_MIN} caracteres.
            </span>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="confirmarSenha">
              Confirmar senha
            </label>
            <input
              id="confirmarSenha"
              className={styles.input}
              type="password"
              autoComplete="new-password"
              placeholder="Repita a senha"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              disabled={enviando}
              required
            />
          </div>

          <button
            className={styles.button}
            type="submit"
            disabled={
              enviando || !nome || !email || !senha || !confirmarSenha
            }
          >
            {enviando ? "Cadastrando..." : "Cadastrar usuário"}
          </button>
        </form>

        <p className={styles.footer}>
          <Link href="/">Voltar para o início</Link>
        </p>
      </div>
    </div>
  );
}
