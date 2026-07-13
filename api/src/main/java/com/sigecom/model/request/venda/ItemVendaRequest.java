package com.sigecom.model.request.venda;

import com.sigecom.domain.enums.TipoDesconto;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record ItemVendaRequest(

        @NotNull(message = "O produto é obrigatório")
        Long produtoId,

        @NotNull(message = "A quantidade é obrigatória")
        @Min(value = 1, message = "A quantidade deve ser maior que zero")
        Integer quantidade,

        // Desconto por item (percentual ou valor fixo). Opcional.
        TipoDesconto tipoDesconto,

        @DecimalMin(value = "0.00", message = "O desconto não pode ser negativo")
        BigDecimal valorDesconto
) {}
