package com.sigecom.model.request.fechamento;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

// so o valor "contado" vem do front, restante o back calcula sozinho
public record FechamentoRequest(
    
    @NotNull(message = "O valor em caixa é obrigatório")
    @PositiveOrZero(message = "O valor  não pode ser negativo")
    BigDecimal valorFisicoInformado
) {}
    
