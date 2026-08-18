// =============================================================
// services/api.ts — Instância Axios centralizada (SIGECOM)
// =============================================================
// - baseURL vinda de NEXT_PUBLIC_API_URL
// - Interceptor de request: anexa Authorization: Bearer <token>
// - Interceptor de response: em 401 limpa token e redireciona
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
// Só 401 (não autenticado) encerra a sessão: token ausente, inválido ou
// expirado — não há o que fazer além de logar de novo.
//
// 403 NÃO encerra. Aí o usuário está autenticado; só não tem permissão para
// aquele recurso. Derrubar a sessão nesse caso desloga um funcionário por
// esbarrar em qualquer rota de ADMIN, e ele volta ao /login sem entender o
// motivo. O erro é propagado para a tela tratar e mostrar a mensagem.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined" && error.response?.status === 401) {
      localStorage.removeItem("sigecom_token");
      localStorage.removeItem("sigecom_user");

      // Evita loop infinito: só redireciona se NÃO estiver já em /login
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
