// =============================================================
// lib/apiError.ts — Tradução de erros da API para mensagens
// =============================================================
// Centraliza o tratamento de erro Axios/ApiError em uma única
// função, reutilizada pelas telas (driver D-5 — Manutenibilidade).
// =============================================================

import axios from "axios";
import type { ApiError } from "@/services/auth";

/**
 * Converte um erro qualquer (Axios, ApiError, rede) em uma
 * mensagem amigável em português para exibir ao usuário.
 *
 * @param err   Erro capturado no catch.
 * @param fallback Mensagem padrão quando nada mais se aplica.
 */
export function mensagemDeErro(
  err: unknown,
  fallback = "Algo deu errado. Tente novamente."
): string {
  if (axios.isAxiosError(err)) {
    // Sem resposta = servidor fora do ar / CORS / sem rede
    if (!err.response) {
      return "Não foi possível conectar ao servidor. Verifique se a API está no ar.";
    }

    const apiError = err.response.data as ApiError | undefined;
    if (apiError?.usuarioMensagem) {
      return apiError.usuarioMensagem;
    }

    // Lista de erros de validação (ex.: senha curta)
    if (apiError?.erros?.length) {
      return apiError.erros.join(" ");
    }

    const status = err.response.status;
    if (status === 401) return "E-mail ou senha incorretos.";
    if (status === 403) return "Você não tem permissão para esta ação.";
    if (status === 409) return "Já existe um usuário com este e-mail.";
  }

  return fallback;
}
