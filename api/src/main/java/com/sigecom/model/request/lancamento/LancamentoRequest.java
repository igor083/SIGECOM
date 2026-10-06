package com.sigecom.model.request.lancamento;

import com.sigecom.domain.enums.FormaPagamentoLancamento;
import com.sigecom.domain.enums.TipoLancamento;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

// serve pra despesa e receita, o campo tipo diferencia
// a data pode ser de tras, quem monta a hora e o service
public record LancamentoRequest(

        @NotNull(message = "O valor é obrigatório")
        @Positive(message = "O valor deve ser maior que zero")
        BigDecimal valor,

        @NotNull(message = "A data é obrigatória")
        LocalDate data,

        @NotNull(message = "A categoria é obrigatória")
        Long categoriaId,

        // opcional: sem descrição, a categoria identifica o lançamento
        @Size(max = 255, message = "A descrição deve ter no máximo 255 caracteres")
        String descricao,

        @NotNull(message = "O tipo é obrigatório")
        TipoLancamento tipo,

        @NotNull(message = "A forma de pagamento é obrigatória")
        FormaPagamentoLancamento formaPagamento
) {}
