package com.sigecom.model.request.produto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record AjustarEstoqueRequest(
        @NotNull(message = "A quantidade é obrigatória")
        @Min(value = 0, message = "A quantidade não pode ser negativa")
        Integer quantidade
) {}
