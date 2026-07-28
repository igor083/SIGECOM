package com.sigecom.model.response.lancamento;

import com.sigecom.domain.CategoriaFinanceira;
import com.sigecom.domain.enums.TipoLancamento;

/**
 * Representação da categoria financeira na resposta da API.
 * Usado como objeto aninhado no LancamentoResponse e também
 * como resposta direta do GET /categorias-financeiras.
 * Tipo é enum: Jackson serializa como string no JSON.
 */
public record CategoriaFinanceiraResponse(
        Long id,
        String nome,
        TipoLancamento tipo,
        boolean protegida
) {

    public static CategoriaFinanceiraResponse toResponse(CategoriaFinanceira entidade) {
        return new CategoriaFinanceiraResponse(
                entidade.getId(),
                entidade.getNome(),
                entidade.getTipo(),
                entidade.isProtegida()
        );
    }
}

