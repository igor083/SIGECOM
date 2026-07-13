// =============================================================
// services/auth.ts — Funções de autenticação (SIGECOM)
// =============================================================
// Usa a instância centralizada de Axios (api.ts).
// Tipagens refletem exatamente o contrato da API Spring Boot.
// =============================================================

import api from "./api";

const IS_MOCK = process.env.NEXT_PUBLIC_MOCK_API === "true";

// ── Tipos ────────────────────────────────────────────────────

/** Perfis de usuário suportados pela API. */
export type TipoUsuario = "ADMIN" | "FUNCIONARIO";

/** Payload enviado para POST /auth/login. */
export interface LoginRequest {
  email: string;
  senha: string;
}

/** Resposta recebida de POST /auth/login. */
export interface LoginResponse {
  /** JWT assinado pelo back-end. */
  token: string;
  /** Duração do token em milissegundos. */
  expiresIn: number;
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
  if (IS_MOCK) {
    await new Promise((r) => setTimeout(r, 400));
    if (!email || !senha) {
      throw { response: { status: 401, data: { usuarioMensagem: "E-mail ou senha incorretos." } } };
    }
    // Monta fake JWT no formato header.payload.signature
    // useAuth decodifica o payload buscando: sub, user_id, role, exp (em segundos)
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = btoa(JSON.stringify({
      sub: email,
      user_id: 1,
      role: "ADMIN",
      exp: Math.floor(Date.now() / 1000) + 3600,
    }));
    const fakeToken = `${header}.${payload}.mock-signature`;
    return { token: fakeToken, expiresIn: 3600000 };
  }

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
