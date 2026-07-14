package com.sigecom.model.request.dashboard;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record AtualizarMetaDiariaRequest(
        @NotNull(message = "O valor da meta é obrigatório")
        @DecimalMin(value = "0.01", message = "A meta deve ser maior que zero")
        BigDecimal valor
) {}
