// =============================================================
// services/api.ts — Instância Axios centralizada (SIGECOM)
// =============================================================
// - baseURL vinda de NEXT_PUBLIC_API_URL
// - Interceptor de request: anexa Authorization: Bearer <token>
// - Interceptor de response: em 401/403 limpa token e redireciona
//   para /login  (driver D-2 — Segurança)
// =============================================================

import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Request interceptor ─────────────────────────────────────
// Anexa o token JWT (se existir) a toda requisição.
api.interceptors.request.use(
  (config) => {
    // Só acessa localStorage no navegador (evita erro em SSR)
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("sigecom_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor ────────────────────────────────────
// Em 401 (não autenticado) ou 403 (sem permissão) limpa o
// token e redireciona para /login.  Isso garante que sessões
// expiradas ou tokens inválidos não deixem o usuário preso.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined" && error.response) {
      const status = error.response.status;
      if (status === 401 || status === 403) {
        localStorage.removeItem("sigecom_token");
        localStorage.removeItem("sigecom_user");

        // Evita loop infinito: só redireciona se NÃO estiver já em /login
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
