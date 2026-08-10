package com.sigecom.model.request.fechamento;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

// valor "contado" e fundo de troco vem do front, restante o back calcula sozinho
public record FechamentoRequest(

    @NotNull(message = "O valor em caixa é obrigatório")
    @PositiveOrZero(message = "O valor  não pode ser negativo")
    BigDecimal valorFisicoInformado,

    // quanto tinha na gaveta quando o caixa abriu (SCRUM-161)
    @NotNull(message = "O fundo de troco é obrigatório")
    @PositiveOrZero(message = "O fundo de troco não pode ser negativo")
    BigDecimal fundoTroco
) {}
