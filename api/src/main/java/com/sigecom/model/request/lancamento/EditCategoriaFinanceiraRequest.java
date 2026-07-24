package com.sigecom.model.request.lancamento;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record EditCategoriaFinanceiraRequest(

        @NotBlank(message = "O nome é obrigatório")
        @Size(max = 100, message = "O nome deve ter no máximo 100 caracteres")
        String nome
) {}
