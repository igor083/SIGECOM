package com.sigecom.model.response.lancamento;

import com.sigecom.domain.LancamentoFinanceiro;
import com.sigecom.domain.enums.DescricaoLancamento;
import com.sigecom.domain.enums.TipoLancamento;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Representação de um lançamento financeiro na resposta da API.
 * Não expõe a entidade JPA diretamente — a categoria vem como
 * CategoriaFinanceiraResponse aninhado (id + nome).
 * Tipo e descrição são enum: Jackson serializa como string no JSON.
 */
public record LancamentoResponse(
        Long id,
        BigDecimal valor,
        LocalDateTime dataHora,
        TipoLancamento tipo,
        DescricaoLancamento descricao,
        CategoriaFinanceiraResponse categoria
) {

    public static LancamentoResponse toResponse(LancamentoFinanceiro entidade) {
        return new LancamentoResponse(
                entidade.getId(),
                entidade.getValor(),
                entidade.getDataHora(),
                entidade.getTipo(),
                entidade.getDescricao(),
                CategoriaFinanceiraResponse.toResponse(entidade.getCategoria())
        );
    }
}
