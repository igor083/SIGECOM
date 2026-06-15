// =============================================================
// hooks/useAuth.ts — Hook de autenticação (SIGECOM)
// =============================================================
// Gerencia estado do usuário, token JWT, login, logout e
// decodificação do perfil (ADMIN | FUNCIONARIO).
//
// Usa Context API para disponibilizar o estado em toda a app.
// Componentes que precisam de auth: const { user, login } = useAuth();
// =============================================================

"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  login as loginService,
  type TipoUsuario,
  type LoginResponse,
} from "@/services/auth";

// ── Tipos ────────────────────────────────────────────────────

/** Dados do usuário extraídos do JWT. */
export interface AuthUser {
  email: string;
  userId: number;
  perfil: TipoUsuario;
}

/** Forma do contexto de autenticação. */
interface AuthContextData {
  /** Usuário autenticado (null se não logado). */
  user: AuthUser | null;
  /** Token JWT bruto. */
  token: string | null;
  /** true enquanto verifica token salvo no storage. */
  loading: boolean;
  /** true se há um usuário autenticado. */
  isAuthenticated: boolean;
  /** Realiza login e persiste o token. */
  login: (email: string, senha: string) => Promise<LoginResponse>;
  /** Limpa token e estado, redireciona para /login. */
  logout: () => void;
}

// ── Helpers ──────────────────────────────────────────────────

const STORAGE_TOKEN_KEY = "sigecom_token";
const STORAGE_USER_KEY = "sigecom_user";

/**
 * Decodifica o payload de um JWT **sem** verificar a assinatura.
 * Suficiente para extrair claims no front-end (a API valida
 * a assinatura server-side a cada requisição).
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;

    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );

    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/** Extrai AuthUser a partir de um JWT decodificado. */
function extractUser(token: string): AuthUser | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;

  // Verifica se o token expirou
  const exp = payload.exp as number | undefined;
  if (exp && Date.now() >= exp * 1000) {
    return null; // token expirado
  }

  const email = payload.sub as string | undefined;
  const userId = payload.user_id as number | undefined;
  const role = payload.role as string | undefined;

  if (!email || userId == null || !role) return null;
  if (role !== "ADMIN" && role !== "FUNCIONARIO") return null;

  return { email, userId, perfil: role as TipoUsuario };
}

// ── Context ──────────────────────────────────────────────────

const AuthContext = createContext<AuthContextData | undefined>(undefined);

// ── Provider ─────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Reidrata o estado a partir do localStorage ao montar.
  // O setState aqui é intencional: a leitura de um sistema externo
  // (localStorage) só é possível no cliente, após a montagem. O flag
  // `loading` impede mismatch de hidratação no SSR enquanto isso ocorre.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    const savedToken = localStorage.getItem(STORAGE_TOKEN_KEY);
    if (savedToken) {
      const decoded = extractUser(savedToken);
      if (decoded) {
        setToken(savedToken);
        setUser(decoded);
      } else {
        // Token inválido ou expirado — limpa
        localStorage.removeItem(STORAGE_TOKEN_KEY);
        localStorage.removeItem(STORAGE_USER_KEY);
      }
    }
    setLoading(false);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const loginFn = useCallback(async (email: string, senha: string) => {
    const data = await loginService(email, senha);

    const decoded = extractUser(data.token);
    if (!decoded) {
      throw new Error("Token retornado pela API é inválido.");
    }

    // Persiste no localStorage
    localStorage.setItem(STORAGE_TOKEN_KEY, data.token);
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(decoded));

    setToken(data.token);
    setUser(decoded);

    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    localStorage.removeItem(STORAGE_USER_KEY);
    setToken(null);
    setUser(null);

    // Redireciona para login (evita loop se já estiver lá)
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        login: loginFn,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────────────

/**
 * Hook para acessar o contexto de autenticação.
 *
 * @example
 * const { user, login, logout, isAuthenticated } = useAuth();
 */
export function useAuth(): AuthContextData {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um <AuthProvider>.");
  }
  return context;
}
