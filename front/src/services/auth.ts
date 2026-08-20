// =============================================================
// services/auth.ts — Funções de autenticação (SIGECOM)
// =============================================================
// Usa a instância centralizada de Axios (api.ts).
// Tipagens refletem exatamente o contrato da API Spring Boot.
// =============================================================

import api from "./api";

// ── Tipos ────────────────────────────────────────────────────

/** Perfis de usuário suportados pela API. */
export type TipoUsuario = "ADMIN" | "FUNCIONARIO";

/** Payload enviado para POST /auth/login. */
export interface LoginRequest {
  email: string;
  senha: string;
}

/** Resposta recebida de POST /auth/login e de PATCH /auth/me/senha. */
export interface LoginResponse {
  /** JWT assinado pelo back-end. */
  token: string;
  /** Duração do token em milissegundos. */
  expiresIn: number;
  /**
   * true quando a senha foi definida por um administrador e ainda não foi
   * trocada pelo dono da conta.
   *
   * Não é informativo: enquanto for true, a API responde 403 em todas as
   * rotas exceto GET /auth/me e PATCH /auth/me/senha (PwdResetRequiredFilter).
   * Quem ignora este campo prende o usuário numa tela de "sem permissão".
   */
  senhaTemporaria: boolean;
}

/** Payload enviado para PATCH /auth/me/senha. */
export interface TrocarSenhaRequest {
  senhaAtual: string;
  /** Mínimo 6 caracteres. */
  senhaNova: string;
}

/** Payload enviado para POST /auth/cadastro (apenas ADMIN). */
export interface CadastroRequest {
  nome: string;
  email: string;
  /** Mínimo 6 caracteres. */
  senha: string;
  perfil: TipoUsuario;
}

/** Resposta recebida de POST /auth/cadastro. */
export interface CadastroResponse {
  id: number;
  nome: string;
  email: string;
  perfil: TipoUsuario;
  ativo: boolean;
  criadoEm: string; // ISO 8601
}

/** Formato padronizado de erro da API. */
export interface ApiError {
  status: number;
  usuarioMensagem: string;
  devMensagem?: string;
  path?: string;
  timestamp?: string;
  erros?: string[];
}

// ── Funções ──────────────────────────────────────────────────

/**
 * Realiza login na API.
 *
 * @returns Token JWT e tempo de expiração.
 */
export async function login(email: string, senha: string): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>("/auth/login", {
    email,
    senha,
  } satisfies LoginRequest);

  return response.data;
}

/**
 * Cadastra um novo usuário (requer token de ADMIN).
 *
 * @returns Dados do usuário criado.
 */
export async function cadastro(dados: CadastroRequest): Promise<CadastroResponse> {
  const response = await api.post<CadastroResponse>("/auth/cadastro", dados);
  return response.data;
}

/**
 * Troca a senha do próprio usuário autenticado.
 *
 * Devolve um token NOVO, e usá-lo não é opcional: o bloqueio de senha
 * temporária está gravado como claim no token, então o antigo continua
 * levando 403 mesmo depois da troca concluída.
 */
export async function trocarMinhaSenha(
  dados: TrocarSenhaRequest
): Promise<LoginResponse> {
  const response = await api.patch<LoginResponse>("/auth/me/senha", dados);
  return response.data;
}
