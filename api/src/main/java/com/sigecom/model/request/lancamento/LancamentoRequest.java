package com.sigecom.model.request.lancamento;

import com.sigecom.domain.enums.DescricaoLancamento;
import com.sigecom.domain.enums.TipoLancamento;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Payload de criação de lançamento financeiro.
 * Usado tanto para DESPESA quanto para RECEITA — o campo tipo diferencia.
 * O campo data é a data escolhida pelo usuário (pode ser retroativa);
 * o dataHora da entidade é preenchido a partir dele no service.
 */
public record LancamentoRequest(

        @NotNull(message = "O valor é obrigatório")
        @Positive(message = "O valor deve ser maior que zero")
        BigDecimal valor,

        @NotNull(message = "A data é obrigatória")
        LocalDate data,

        @NotNull(message = "A categoria é obrigatória")
        Long categoriaId,

        @NotNull(message = "A descrição é obrigatória")
        DescricaoLancamento descricao,

        @NotNull(message = "O tipo é obrigatório")
        TipoLancamento tipo
) {}
