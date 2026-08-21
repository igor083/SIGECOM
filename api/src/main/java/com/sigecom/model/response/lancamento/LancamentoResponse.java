package com.sigecom.model.response.lancamento;

import com.sigecom.domain.LancamentoFinanceiro;
import com.sigecom.domain.enums.FormaPagamentoLancamento;
import com.sigecom.domain.enums.TipoLancamento;

import java.math.BigDecimal;
import java.time.LocalDateTime;

// nao devolve a entidade direto, a categoria vem so com id e nome
public record LancamentoResponse(
        Long id,
        BigDecimal valor,
        LocalDateTime dataHora,
        TipoLancamento tipo,
        String descricao,
        CategoriaFinanceiraResponse categoria,
        FormaPagamentoLancamento formaPagamento
) {

    public static LancamentoResponse toResponse(LancamentoFinanceiro entidade) {
        return new LancamentoResponse(
                entidade.getId(),
                entidade.getValor(),
                entidade.getDataHora(),
                entidade.getTipo(),
                entidade.getDescricao(),
                CategoriaFinanceiraResponse.toResponse(entidade.getCategoria()),
                entidade.getFormaPagamento()
        );
    }
}
